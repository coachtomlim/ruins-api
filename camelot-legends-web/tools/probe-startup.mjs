import { createRequire } from "node:module";

const require = createRequire(
  "file:///C:/Users/Thomas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/",
);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
const messages = [];
page.on("console", (message) => messages.push(`${message.type()}: ${message.text()}`));
page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
await page.goto("http://localhost:4173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const text = await page.locator("body").innerText().catch((error) => error.message);
await page.screenshot({ path: "demo-startup-probe.png", fullPage: true });
await browser.close();
console.log(JSON.stringify({ text, messages }, null, 2));
