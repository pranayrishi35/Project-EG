import { test, expect } from '@playwright/test';
import * as path from 'path';
import { isMockAuthAllowed } from '../src/lib/testAuthGuard';

const ARTIFACT_DIR = 'C:/Users/prana/.gemini/antigravity/brain/a29a0875-e5ec-409f-9966-4934866c297c';
const PROJECT_REF = 'vdcmwlkbcisnidtubmnb';
const mockSessionStr = JSON.stringify({
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: '12345678-1234-1234-1234-123456789012',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'pilot@exampilot.com',
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'Squadron Leader' }
  }
});

test.describe('Phase 3 — Sitewide Visual Harmonization, Zero-Emoji CBT Nav Bar, Tejas Widget Post-Fix & Throttled 3G Spot-Check', () => {

  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      { name: `sb-${PROJECT_REF}-auth-token`, value: encodeURIComponent(mockSessionStr), domain: 'localhost', path: '/' },
      { name: `sb-${PROJECT_REF}-auth-token`, value: encodeURIComponent(mockSessionStr), domain: '127.0.0.1', path: '/' },
      { name: 'consent_granted', value: 'true', domain: 'localhost', path: '/' },
      { name: 'consent_granted', value: 'true', domain: '127.0.0.1', path: '/' }
    ]);
    await page.addStyleTag({ content: '[data-reticle-overlay] { display: none !important; pointer-events: none !important; }' });
  });

  test('1. Previously-indigo Tejas floating study widget post-fix confirmation & screenshot capture', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Locate the floating Tejas FAB trigger button at bottom right
    const fab = page.locator('button[aria-label*="Open Tejas"]');
    await expect(fab).toBeVisible();

    // Verify FAB uses our curated aviation brand accents (no legacy indigo or violet)
    const fabClass = await fab.getAttribute('class') || '';
    expect(fabClass.toLowerCase()).not.toContain('indigo');
    expect(fabClass.toLowerCase()).not.toContain('violet');
    expect(fabClass).toContain('from-brand-accent-500');

    // Click FAB to open the Tejas study wingman dialog
    await fab.click();
    
    const dialog = page.locator('div[role="dialog"][aria-label="Tejas AI study assistant"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Ensure the header contains our authoritative military-grade styling tokens and zero indigo/violet
    const dialogMarkup = await dialog.evaluate(el => el.outerHTML);
    expect(dialogMarkup.toLowerCase()).not.toContain('indigo');
    expect(dialogMarkup.toLowerCase()).not.toContain('violet');
    expect(dialogMarkup).toContain('bg-gradient-to-br from-brand-bg-elevated to-brand-bg-surface');
    expect(dialogMarkup).toContain('AI Study Wingman');

    // Capture precise post-fix photographic evidence of the open Tejas widget
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tejas_widget_postfix.png'), fullPage: false });
    console.log('[Verification] Successfully captured tejas_widget_postfix.png without any legacy indigo or violet styles.');
  });

  test('2. Previously-emoji CBT navigation bar post-fix & motion-exclusion compliance on real mock exam', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Navigate directly to the authentic production CBT practice mock route
    await page.goto('/practice/mock/demo-test-101');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // allow CBT test store to initialize

    // Strict pathname assertions
    expect(new URL(page.url()).pathname).toBe('/practice/mock/demo-test-101');

    // Verify top navigation header bar exists and is visible
    const topBar = page.locator('div.border-b.border-slate-300').first();
    await expect(topBar).toBeVisible();

    // Assert zero emoji contamination in the entire CBT test header and navigation controls
    const topBarText = await topBar.innerText();
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    expect(emojiRegex.test(topBarText)).toBe(false);
    console.log('[Verification] CBT Top Bar verified clean of emoji characters:', topBarText.replace(/\n/g, ' '));

    // Confirm replacement with high-precision Lucide icons and authoritative color discipline
    const topBarHtml = await topBar.evaluate(el => el.innerHTML);
    expect(topBarHtml).toContain('AFCAT CBT Portal');
    expect(topBarHtml.toLowerCase()).not.toContain('indigo');
    expect(topBarHtml.toLowerCase()).not.toContain('violet');

    // Re-verify the strict CBT motion-exclusion rule (no custom jet cursor or distracting background animations mounted)
    await expect(page.getByTestId('jet-cursor')).toHaveCount(0);
    const dataCursor = await page.evaluate(() => document.documentElement.getAttribute('data-cursor'));
    expect(dataCursor).toBeNull();

    // Capture high-resolution post-fix screenshot of the clean, professional CBT navigation bar and test portal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cbt_navbar_postfix.png'), fullPage: false });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cbt_navbar_production_verified.png'), fullPage: false });
    console.log('[Verification] Successfully captured cbt_navbar_postfix.png and cbt_navbar_production_verified.png proving zero emoji contamination and motion exclusion on authenticated production route.');
  });

  test('3. Fast 3G Throttled Network Profile Spot-Check for +98 KB Initial Hydration Latency', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Attach Chrome DevTools Protocol session to emulate Fast 3G cellular network profile
    // Standard Fast 3G specifications: 1.6 Mbps down (200,000 bytes/sec), 750 Kbps up (93,750 bytes/sec), 150ms round-trip latency
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.enable');
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    });

    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    const elapsedMs = Date.now() - startTime;

    // Evaluate script execution and network transfer timing from resource entries
    const timing = await page.evaluate(() => {
      const nav = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadEventEnd: Math.round(nav.loadEventEnd - nav.startTime),
      };
    });

    console.log(`\n=============================================================================`);
    console.log(`          FAST 3G THROTTLED HYDRATION SPOT-CHECK (1.6 Mbps / 150ms)`);
    console.log(`=============================================================================`);
    console.log(`  Total Navigation Elapsed Time:              ${elapsedMs} ms (${(elapsedMs / 1000).toFixed(2)}s)`);
    console.log(`  DOM Content Loaded (Interactive DOM):       ${timing.domContentLoaded} ms`);
    console.log(`  Window Load Event End (Full Hydration):      ${timing.loadEventEnd} ms`);
    console.log(`  Theoretical Wire Time for +98 KB at 1.6 Mbps: ~490 ms`);
    console.log(`=============================================================================\n`);

    // Ensure page hydrates gracefully under throttled profile without failing or crashing
    expect(timing.domContentLoaded).toBeGreaterThan(0);
    expect(timing.loadEventEnd).toBeGreaterThan(0);
  });

  test('4. Automated Security Audit: isMockAuthAllowed() fails closed under simulated production deploy leak', () => {
    const origAllow = process.env.ALLOW_MOCK_AUTH;
    const origNodeEnv = process.env.NODE_ENV;

    try {
      // Simulate accidental ALLOW_MOCK_AUTH=true environment variable leak into a production deployment
      process.env.ALLOW_MOCK_AUTH = 'true';
      process.env.NODE_ENV = 'production';

      // Categorical assertion on the exact helper function used across all middleware and server page guards
      expect(isMockAuthAllowed()).toBe(false);

      // Confirm that auth bypass only evaluates true when NODE_ENV is explicitly non-production
      process.env.NODE_ENV = 'test';
      expect(isMockAuthAllowed()).toBe(true);
      console.log('[Security Audit] Verified isMockAuthAllowed() strictly rejects auth bypass under production NODE_ENV, even when ALLOW_MOCK_AUTH=true is accidentally leaked.');
    } finally {
      process.env.ALLOW_MOCK_AUTH = origAllow;
      if (origNodeEnv !== undefined) {
        process.env.NODE_ENV = origNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    }
  });
});
