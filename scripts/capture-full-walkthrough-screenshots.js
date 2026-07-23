const fs = require("node:fs");
const path = require("node:path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = path.resolve(__dirname, "..", "docs", "beta");
const userDataDir = path.resolve(__dirname, "..", `.tmp-edge-full-walkthrough-${Date.now()}`);
const ruinsPort = process.env.RUINS_PORT || process.env.PORT || "4273";
const debugPort = process.env.RUINS_EDGE_DEBUG_PORT || "9225";

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

    async function command(value, waitMs = 220) {
      await cdp("Runtime.evaluate", {
        expression: `document.getElementById("cmd").value = ${JSON.stringify(value)}; document.getElementById("send").click();`,
        awaitPromise: true
      }, sessionId);
      await sleep(waitMs);
    }

    async function autoFight(scrollName = null) {
      const phase = await pageValue("window.__RUINS_STATE__ ? window.__RUINS_STATE__.phase : null");
      if (phase !== "combat") return;
      if (scrollName) await command(`Use Item ${scrollName}`, 400);
      let guard = 0;
      while ((await pageValue("window.__RUINS_STATE__.phase")) === "combat") {
        await command("Attack Once", 220);
        guard += 1;
        if (guard > 120) throw new Error("Combat capture guard exceeded.");
      }
      await sleep(400);
    }

    async function pageValue(expression) {
      const result = await cdp("Runtime.evaluate", { expression, returnByValue: true }, sessionId);
      return result.result.value;
    }

    async function assertText(selector, text) {
      const found = await pageValue(`Boolean(document.querySelector(${JSON.stringify(selector)}) && document.querySelector(${JSON.stringify(selector)}).textContent.includes(${JSON.stringify(text)}))`);
      if (!found) throw new Error(`Expected ${selector} to include ${text}.`);
    }

    async function screenshot(name) {
      const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
      const outPath = path.join(outDir, name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
      console.log(`Walkthrough screenshot written: ${outPath}`);
    }

    await cdp("Runtime.evaluate", {
      expression: `Object.defineProperty(window, "__RUINS_STATE__", { get() { return window.__RUINS_DEBUG_STATE__ && window.__RUINS_DEBUG_STATE__(); } });`,
      awaitPromise: true
    }, sessionId);

    for (const value of ["Offer", "Negotiate", "Bargain", "Yes", "Say"]) await command(value, 280);
    await command("North", 700);
    await autoFight();
    await command("Pick up Fog of Confusion");
    await command("Examine shrine");
    await command("East", 700);
    await autoFight();
    await command("Examine mirror shards");
    await command("Pick up Hexagonal Glass Piece");
    await command("North", 700);
    await autoFight("Fog of Confusion");
    await command("Pick up Heart Beacon");
    await command("Examine east wall");
    await command("Examine panel");
    await command("Pick up Sound-Deflecting Girdle");
    await command("Pick up Lorebook");
    await command("South", 700);
    await command("South", 700);
    await command("South", 700);
    await command("North", 700);
    await command("Examine sarcophagus");
    await command("Pick up Cure All Stats Potion");
    await command("go northwest", 700);
    await autoFight();
    await command("Pick up Pulse of Calm");
    await command("West", 700);
    await autoFight("Pulse of Calm");
    await command("Pick up Prism Fragment B");
    await command("Examine north wall mural");
    await command("South", 700);
    await command("South", 700);
    await autoFight("Heart Beacon");
    await command("Pick up Prism Fragment C");
    await command("Use Cure All Stats Potion");
    await command("Assemble");
    await command("South", 700);
    await assertText("#eventTitle", "Galanic Store");
    await screenshot("beta-4-store-state.png");
    await command("Buy 1");
    await command("Equip shield");
    await command("Buy 3");
    await command("Equip hose");
    await command("West", 700);
    await assertText("#eventTitle", "Banshee");
    await screenshot("beta-4-boss-state.png");
    await autoFight();
    await command("Examine crystal stand");
    await command("Pick up Merlin's Tetrahedronal");
    await assertText("#eventTitle", "Quest Complete");
    await screenshot("beta-4-ending-state.png");
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
