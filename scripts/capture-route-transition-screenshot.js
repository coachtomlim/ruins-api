const fs = require("node:fs");
const path = require("node:path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outPath = path.resolve(__dirname, "..", "docs", "beta", "beta-3-route-transition-strip.png");
const userDataDir = path.resolve(__dirname, "..", `.tmp-edge-routes-${Date.now()}`);
const ruinsPort = process.env.RUINS_PORT || process.env.PORT || "4273";
const debugPort = process.env.RUINS_EDGE_DEBUG_PORT || "9224";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cdp(method, params = {}, sessionId = null) {
  const id = ++cdp.nextId;
  const message = { id, method, params };
  if (sessionId) message.sessionId = sessionId;
  cdp.ws.send(JSON.stringify(message));
  return new Promise((resolve, reject) => {
    cdp.pending.set(id, { resolve, reject });
  });
}
cdp.nextId = 0;
cdp.pending = new Map();

async function main() {
  const { spawn } = require("node:child_process");
  fs.rmSync(userDataDir, { recursive: true, force: true });
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${debugPort}`,
    "--window-size=1200,900",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    let version;
    for (let i = 0; i < 50; i += 1) {
      try {
        version = await fetch(`http://localhost:${debugPort}/json/version`).then((r) => r.json());
        break;
      } catch {
        await sleep(100);
      }
    }
    if (!version) throw new Error("Could not connect to Edge remote debugging endpoint.");

    cdp.ws = new WebSocket(version.webSocketDebuggerUrl);
    cdp.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const pending = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(msg.error.message));
        else pending.resolve(msg.result);
      }
    });
    await new Promise((resolve) => cdp.ws.addEventListener("open", resolve, { once: true }));

    const target = await cdp("Target.createTarget", { url: `http://localhost:${ruinsPort}/play.html` });
    const attached = await cdp("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp("Runtime.enable", {}, sessionId);
    await cdp("Page.enable", {}, sessionId);
    await sleep(700);

    async function command(value) {
      await cdp("Runtime.evaluate", {
        expression: `document.getElementById("cmd").value = ${JSON.stringify(value)}; document.getElementById("send").click();`,
        awaitPromise: true
      }, sessionId);
      await sleep(250);
    }

    for (const value of ["Offer", "Negotiate", "Bargain", "Yes", "Say", "North"]) {
      await command(value);
    }

    const transitionVisible = await cdp("Runtime.evaluate", {
      expression: `(() => {
        const strip = document.getElementById("transitionStrip");
        const frames = document.querySelectorAll("#transitionFrames img");
        const miniMap = document.getElementById("miniMap");
        const breadcrumbs = document.getElementById("breadcrumbs");
        return Boolean(
          strip &&
          !strip.hidden &&
          frames.length > 0 &&
          miniMap &&
          miniMap.textContent.includes("Shrine") &&
          breadcrumbs &&
          breadcrumbs.textContent.includes("Altar")
        );
      })()`,
      returnByValue: true
    }, sessionId);
    if (!transitionVisible.result.value) throw new Error("Route transition strip did not render.");

    await sleep(500);
    const screenshot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
    console.log(`Route transition screenshot written: ${outPath}`);
  } finally {
    edge.kill();
    await sleep(750);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Edge can hold the profile lock briefly after headless shutdown.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
