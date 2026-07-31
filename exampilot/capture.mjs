import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Waiting for localhost:3000...");
  let ready = false;
  for(let i=0; i<60; i++) {
    try {
      await page.goto('http://localhost:4000', { waitUntil: 'networkidle', timeout: 5000 });
      ready = true;
      break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    console.error("Server not ready");
    process.exit(1);
  }

  console.log("Capturing landing page...");
  await page.screenshot({ path: 'landing.png', fullPage: true });

  console.log("Capturing welcome page...");
  await page.goto('http://localhost:4000/welcome', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'welcome.png', fullPage: true });

  await browser.close();
  console.log("Done!");
})();
