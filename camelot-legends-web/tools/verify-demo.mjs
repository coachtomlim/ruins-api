import { createRequire } from "node:module";

const require = createRequire(
  "file:///C:/Users/Thomas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/",
);
const { chromium } = require("playwright");

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
await page.getByRole("button", { name: "Start New Game" }).click();
await page.getByRole("button", { name: "Speak With Mystery" }).click();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Next Area" }).click();
await page.getByRole("button", { name: "Search the Road" }).click();
await page.getByRole("button", { name: "Next Area" }).click();
await page.getByRole("button", { name: "Recover Armor" }).click();
await page.getByRole("button", { name: "Inventory" }).click();
await page.getByRole("button", { name: "Equip" }).click();
await page.getByRole("button", { name: "Scene" }).click();
await page.getByRole("button", { name: "Next Area" }).click();
await page.getByRole("button", { name: "Next Area" }).click();
await page.getByRole("button", { name: "Face Raider" }).click();

for (let index = 0; index < 4; index += 1) {
  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("Demo path complete")) break;
  const lightning = page.getByRole("button", { name: "Lightning Shot" });
  if ((await lightning.count()) === 0) break;
  await lightning.click();
}

await page.getByRole("button", { name: "Save", exact: true }).click();
await page.getByRole("button", { name: "Load", exact: true }).click();

const bodyText = await page.locator("body").innerText();
const pwaStatus = await page.evaluate(async () => {
  const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute("href") || "";
  let serviceWorkerReady = false;
  if ("serviceWorker" in navigator) {
    serviceWorkerReady = await Promise.race([
      navigator.serviceWorker.ready.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 3000)),
    ]);
  }
  return { manifestHref, serviceWorkerReady };
});
await page.screenshot({ path: "demo-mobile-verify.png", fullPage: true });
await page.context().setOffline(true);
await page.reload({ waitUntil: "networkidle" });
const offlineText = await page.locator("body").innerText();
await page.context().setOffline(false);

const result = {
  complete: bodyText.includes("Demo path complete"),
  hasArea: bodyText.includes("Ep. 05: Storm the Castle"),
  hasReward: bodyText.includes("Reward: 15 gold, 20 XP"),
  hasManifest: pwaStatus.manifestHref.includes("manifest.webmanifest"),
  serviceWorkerReady: pwaStatus.serviceWorkerReady,
  offlineReady: offlineText.includes("Camelot Legends") && offlineText.includes("Start New Game"),
  hasSaveFeedback:
    bodyText.includes("Save loaded") || bodyText.includes("Saved to IndexedDB"),
  consoleErrors,
};

await browser.close();

if (
  !result.complete ||
  !result.hasArea ||
  !result.hasReward ||
  !result.hasManifest ||
  !result.serviceWorkerReady ||
  !result.offlineReady ||
  !result.hasSaveFeedback ||
  consoleErrors.length
) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
