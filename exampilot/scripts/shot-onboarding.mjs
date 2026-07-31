import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = "screenshots/onboarding-v6";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/welcome", { waitUntil: "networkidle" });

for (let step = 1; step <= 8; step++) {
  // Wait for the current step container to render.
  await page.waitForSelector(`[data-testid="onboarding-step-${step}"]`, { timeout: 15000 });
  await page.waitForTimeout(500); // let fade-in settle

  // Step 2 requires selecting an answer to reveal the explanation; click first option.
  if (step === 2) {
    const opt = page.locator("#option-1");
    if (await opt.count()) { await opt.click(); await page.waitForTimeout(400); }
  }

  await page.screenshot({ path: `${OUT}/step-${step}.png`, fullPage: true });
  console.log(`shot step ${step}`);

  if (step < 8) {
    await page.click("#btn-next-step");
    await page.waitForTimeout(700); // step transition + scrollTo
  }
}

await browser.close();
if (errors.length) {
  console.log("PAGE_ERRORS:\n" + errors.join("\n"));
} else {
  console.log("NO_PAGE_ERRORS");
}
