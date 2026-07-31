import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/prana/.gemini/antigravity/brain/e6ea92a0-da52-4df8-9de7-dc834cec3f75/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const routes = [
  '/',
  '/login',
  '/admin',
  '/practice',
  '/planner',
  '/booklets',
  '/flashcards',
  '/welcome',
  '/terms',
  '/privacy'
];

async function run() {
  console.log("Starting Audit Script...");
  const browser = await chromium.launch({ headless: true });
  
  // Desktop
  const desktopContext = await browser.newContext(devices['Desktop Chrome']);
  const page = await desktopContext.newPage();
  
  // Add console listener
  let consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    consoleErrors.push(`[pageerror] ${error.message}`);
  });

  for (const route of routes) {
    console.log(`Auditing (Desktop): ${route}`);
    await page.goto(`http://localhost:4005${route}`, { waitUntil: 'networkidle' });
    
    // Screenshot
    const name = route === '/' ? 'home' : route.replace(/\//g, '_').substring(1);
    await page.screenshot({ path: path.join(outDir, `desktop_${name}.png`), fullPage: true });

    // Axe
    try {
      const results = await new AxeBuilder({ page }).analyze();
      if (results.violations.length > 0) {
        console.log(`Axe Violations on ${route}:`, results.violations.length);
      }
    } catch (e) {
      console.log(`Axe failed on ${route}:`, e.message);
    }
  }

  // Mobile
  const mobileContext = await browser.newContext(devices['Pixel 5']);
  const mPage = await mobileContext.newPage();
  for (const route of routes) {
    console.log(`Auditing (Mobile): ${route}`);
    await mPage.goto(`http://localhost:4005${route}`, { waitUntil: 'networkidle' });
    const name = route === '/' ? 'home' : route.replace(/\//g, '_').substring(1);
    await mPage.screenshot({ path: path.join(outDir, `mobile_${name}.png`), fullPage: true });
  }

  await browser.close();
  
  console.log("=== Console Errors ===");
  if (consoleErrors.length === 0) {
    console.log("None");
  } else {
    consoleErrors.forEach(e => console.log(e));
  }
  console.log("Audit Script Complete.");
}

run();
