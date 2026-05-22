const fs = require("node:fs");
const path = require("node:path");

async function run() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });

  const transcript = [];
  let cursor = 0;
  let step = 0;

  function add(line) {
    transcript.push(line);
    console.log(line);
  }

  async function collectLogDelta() {
    const full = await page.locator("#log").innerText();
    const delta = full.slice(cursor).trim();
    cursor = full.length;
    if (!delta) return;
    for (const block of delta.split("\n\n")) {
      const text = block.trim();
      if (text) add(`LOG: ${text}`);
    }
  }

  async function phase() {
    const label = (await page.locator("#roomLabel").innerText()).toLowerCase();
    if (label.includes("(combat)")) return "combat";
    if (label.includes("(prologue)")) return "prologue";
    if (label.includes("(ended)")) return "ended";
    return "exploration";
  }

  async function cmd(input, waitMs = 220) {
    if ((await phase()) === "ended") return;
    step += 1;
    add(`STEP ${String(step).padStart(3, "0")} COMMAND: ${input}`);
    await page.locator("#cmd").fill(input);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(waitMs);
    await collectLogDelta();
  }

  async function click(name, waitMs = 220) {
    if ((await phase()) === "ended") return;
    step += 1;
    add(`STEP ${String(step).padStart(3, "0")} CLICK: ${name}`);
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(waitMs);
    await collectLogDelta();
  }

  async function runCombatPlan(preferredScroll) {
    if ((await phase()) !== "combat") return;

    if (preferredScroll) {
      await cmd(`Use Item ${preferredScroll}`, 260);
    }
    if ((await phase()) !== "combat") return;

    await click("Fight till the end", 300);
    for (let i = 0; i < 500; i += 1) {
      await page.waitForTimeout(120);
      await collectLogDelta();
      if ((await phase()) !== "combat") return;
      if (await page.locator("#cmd").isDisabled()) return;
    }
    add("WARN: Combat did not resolve in expected window.");
  }

  async function go(input, scrollIfCombat = null) {
    if ((await phase()) === "ended") return;
    await cmd(input);
    await runCombatPlan(scrollIfCombat);
  }

  await page.goto("http://localhost:4173/play.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await collectLogDelta();

  // Prologue
  await cmd("Offer");
  await cmd("Negotiate");
  await cmd("Bargain");
  await cmd("Yes");
  await cmd("Say");

  // Room 1 preparation
  await cmd("Examine prism face 1");
  await cmd("Examine prism face 2");
  await cmd("Examine prism face 3");
  await cmd("Examine");

  // Room 2
  await go("North");
  await cmd("Pick up Fog of Confusion");
  await cmd("Examine shrine");

  // Room 6
  await go("East");
  await cmd("Examine mirror shards");
  await cmd("Pick up Hexagonal Glass Piece");

  // Room 5 (Imp + panel flow)
  await go("North", "Fog of Confusion");
  await cmd("Pick up Heart Beacon");
  await cmd("Examine east wall");
  await cmd("Examine panel");
  await cmd("Pick up Sound-Deflecting Girdle");
  await cmd("Pick up Lorebook");

  // Back to Room 2 then Room 3 -> Room 4 -> Room 8
  await go("South");
  await go("South");
  await go("South");
  await go("North");
  await cmd("Examine sarcophagus");
  await cmd("Pick up Cure All Stats Potion");
  await go("go northwest");
  await cmd("Pick up Pulse of Calm");
  await go("West", "Pulse of Calm");
  await cmd("Pick up Prism Fragment B");
  await cmd("Examine north wall mural");

  // Room 7 for Prism C
  await go("South");
  await go("South", "Heart Beacon");
  await cmd("Pick up Prism Fragment C");
  await cmd("Use Cure All Stats Potion");

  // Assemble and finish
  await cmd("Assemble");
  await go("South");
  await cmd("Buy 1");
  await cmd("Equip shield");
  await cmd("Buy 3");
  await cmd("Equip hose");
  await go("West");
  await runCombatPlan(null);
  await cmd("Examine crystal stand");
  await cmd("Pick up Merlin's Tetrahedronal");
  await cmd("Read Journal");

  const finalPhase = await phase();
  add(`RESULT: final phase is ${finalPhase}`);

  const screenshotPath = path.resolve(__dirname, "..", "docs", "walkthrough-final-ui.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  add(`ARTIFACT: screenshot ${screenshotPath}`);

  const outPath = path.resolve(__dirname, "..", "docs", "walkthrough-log.md");
  fs.writeFileSync(outPath, `# Ruins UI Walkthrough Log\n\n${transcript.map((x) => `- ${x}`).join("\n")}\n`, "utf8");
  add(`ARTIFACT: log ${outPath}`);

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
