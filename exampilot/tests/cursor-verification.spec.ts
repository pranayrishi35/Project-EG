import { test, expect } from '@playwright/test';

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
    email: 'test@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: {}
  }
});

test.describe('Phase 1 — Jet Custom Cursor Verification & Authentic CBT Exclusion', () => {

  test.beforeEach(async ({ context, page }, testInfo) => {
    // Custom cursor requires fine pointer and >=1024px; skip on emulated mobile profiles
    if (testInfo.project.name.includes('Mobile') || testInfo.project.name.includes('Android') || testInfo.project.name.includes('iPhone')) {
      test.skip();
      return;
    }

    // Bypass middleware authentication redirects and mandatory consent gating on practice routes
    await context.addCookies([
      {
        name: `sb-${PROJECT_REF}-auth-token`,
        value: encodeURIComponent(mockSessionStr),
        domain: 'localhost',
        path: '/',
      },
      {
        name: `sb-${PROJECT_REF}-auth-token`,
        value: encodeURIComponent(mockSessionStr),
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'consent_granted',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'consent_granted',
        value: 'true',
        domain: '127.0.0.1',
        path: '/',
      }
    ]);

    await page.addStyleTag({ content: '[data-reticle-overlay] { display: none !important; pointer-events: none !important; }' });
  });

  test('Jet custom cursor follows mouse trajectory and rotates via atan2 on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Initial movement to mount cursor position at (200, 200)
    await page.mouse.move(200, 200);
    await page.waitForTimeout(100);

    const cursor = page.getByTestId('jet-cursor');
    await expect(cursor).toBeVisible();

    // 2. Move diagonally down and to the right: (200,200) -> (300,300)
    // dx = 100, dy = 100 => Math.atan2(100, 100) = +45 degrees
    await page.mouse.move(300, 300, { steps: 5 });
    await page.waitForTimeout(150);

    const transform45 = await cursor.evaluate(el => (el as HTMLElement).style.transform);
    console.log('[Diagnostic] 45-Degree Trajectory Transform:', transform45);

    expect(transform45).toContain('translate3d(288px, 288px, 0px)');
    expect(transform45).toContain('rotate(45deg)');

    // 3. Move horizontally left: (300,300) -> (100,300)
    // dx = -200, dy = 0 => Math.atan2(0, -200) = +180 degrees
    await page.mouse.move(100, 300, { steps: 5 });
    await page.waitForTimeout(150);

    const transform180 = await cursor.evaluate(el => (el as HTMLElement).style.transform);
    console.log('[Diagnostic] 180-Degree (Left) Trajectory Transform:', transform180);

    expect(transform180).toContain('translate3d(88px, 288px, 0px)');
    expect(transform180).toContain('rotate(180deg)');
  });

  test('Jet custom cursor is completely unmounted on AUTHENTIC CBT testing routes (/practice/current-affairs and /practice/mock/*)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 1. Verify on real protected /practice/current-affairs route
    await page.goto('/practice/current-affairs');
    await page.waitForLoadState('domcontentloaded');
    
    // Strict pathname verification to prevent query parameter matching on /login or /consent redirects
    expect(new URL(page.url()).pathname).toBe('/practice/current-affairs');

    await page.mouse.move(300, 300);
    await page.waitForTimeout(150);

    const cursor = page.getByTestId('jet-cursor');
    await expect(cursor).toHaveCount(0);
    
    let dataCursor = await page.evaluate(() => document.documentElement.getAttribute('data-cursor'));
    expect(dataCursor).toBeNull();

    // 2. Verify on real protected dynamic mock route /practice/mock/[id]
    await page.goto('/practice/mock/demo-test-101');
    await page.waitForLoadState('domcontentloaded');
    
    expect(new URL(page.url()).pathname).toBe('/practice/mock/demo-test-101');

    await page.mouse.move(400, 400);
    await page.waitForTimeout(150);

    await expect(cursor).toHaveCount(0);
    dataCursor = await page.evaluate(() => document.documentElement.getAttribute('data-cursor'));
    expect(dataCursor).toBeNull();
  });

});
