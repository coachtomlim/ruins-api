import { createRequire } from "node:module";

const require = createRequire(
  "file:///C:/Users/Thomas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/",
);
const { chromium } = require("playwright");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function imageVisible(page, selector) {
  await page.locator(selector).waitFor({ state: "visible" });
  await page.waitForFunction((targetSelector) => {
    const element = document.querySelector(targetSelector);
    return element && element.naturalWidth > 0 && element.getBoundingClientRect().width > 0;
  }, selector);
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      src: element.getAttribute("src"),
      naturalWidth: element.naturalWidth || 0,
      naturalHeight: element.naturalHeight || 0,
      width: rect.width,
      height: rect.height,
      visible:
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(element).visibility !== "hidden" &&
        getComputedStyle(element).display !== "none",
    };
  });
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto("http://localhost:4173", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Start Level 1" }).click();

let map = await imageVisible(page, '[data-visual="map-background"]');
let party = await imageVisible(page, '[data-visual-actor="party"] img');
assert(map.visible && map.naturalWidth > 0, "Level 1 map background must be visible");
assert(party.visible && party.naturalWidth > 0, "Party visual must be visible in exploration");

await page.getByRole("button", { name: "Speak With Mystery" }).click();
assert(await page.getByText("Mystery").count(), "Dialogue speaker label Mystery must render");
assert(await page.getByText("Claramond").count(), "Dialogue speaker label Claramond must render");
await page.getByRole("button", { name: "Continue" }).click();

await page.getByRole("button", { name: "Next Area" }).click();
await page.getByRole("button", { name: "Search Road Cache" }).click();
await page.getByRole("button", { name: "Next Area" }).click();

assert(await page.locator('[data-visual-actor="survivor"]').count(), "Survivor marker must be present in area 003");
await page.getByRole("button", { name: "Recover Armor" }).click();
await page.getByRole("button", { name: "Inventory" }).click();
await page.getByRole("button", { name: "Equip" }).click();
await page.getByRole("button", { name: "Scene" }).click();
await page.getByRole("button", { name: /Rally Survivors/ }).click();
assert(await page.getByText("Castle Survivor").count(), "Survivor interaction must show speaker");
await page.getByRole("button", { name: /Rally the Survivors/ }).click();

await page.getByRole("button", { name: "Next Area" }).click();
assert(await page.locator('[data-visual-actor="scout-shadow"]').count(), "Scout/enemy marker must be present in area 004");
await page.getByRole("button", { name: /Scout Castle Approach/ }).click();
await page.getByRole("button", { name: /Use Survivor Information/ }).click();

await page.getByRole("button", { name: "Next Area" }).click();
assert(await page.locator('[data-visual-actor="forgon-presence"]').count(), "Forgon presence marker must be present in area 005");
await page.getByRole("button", { name: "Engage Forgon Scout" }).click();

const battleBg = await imageVisible(page, '[data-visual="battle-background"]');
const battleParty = await imageVisible(page, '[data-visual="battle-party"] img');
const forgon = await imageVisible(page, '[data-visual="forgon-enemy"] img');
assert(battleBg.visible && battleBg.naturalWidth > 0, "Battle background must be visible");
assert(battleParty.visible && battleParty.naturalWidth > 0, "Battle party visual must be visible");
assert(forgon.visible && forgon.naturalWidth > 0, "Forgon enemy visual must be visible");
assert(await page.getByText("Enemy intent").count(), "Enemy intent must be visible");

await page.getByRole("button", { name: /Lightning Shot/ }).click();
await page.getByRole("button", { name: /Lightning Shot/ }).click();
await page.getByRole("button", { name: /Battle Cry/ }).click();
await page.getByRole("button", { name: /Lightning Shot/ }).click();
await page.getByRole("button", { name: /Strike/ }).click();

const victoryVisual = await imageVisible(page, '[data-visual="victory-visual"] img:last-child');
assert(victoryVisual.visible && victoryVisual.naturalWidth > 0, "Victory party visual must be visible");
assert(await page.getByText("Level Complete").count(), "Victory screen must be visible");

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
assert(!overflow, "Mobile viewport must not have horizontal overflow");
assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join("; ")}`);

await page.screenshot({ path: "demo-visual-slice-mobile.png", fullPage: true });
await browser.close();

console.log(JSON.stringify({
  map,
  party,
  battleBg,
  battleParty,
  forgon,
  victoryVisual,
  consoleErrors,
}, null, 2));
