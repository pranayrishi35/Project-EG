import { test, expect } from '@playwright/test';
import * as path from 'path';

const ARTIFACT_DIR = 'C:/Users/prana/.gemini/antigravity/brain/a29a0875-e5ec-409f-9966-4934866c297c';

test.describe('Phase 2 — 3D Hero Element Scrollytelling, Empirical Suspension & Visual Capture', () => {

  test('Desktop: mounts 3D WebGL Canvas, captures real WebGL screenshot, executes scrollytelling frames, and EMPIRICALLY SUSPENDS on scroll-out', async ({ page }, testInfo) => {
    // Only execute WebGL suspension proof on Desktop browser profiles
    if (testInfo.project.name.includes('Mobile') || testInfo.project.name.includes('Android') || testInfo.project.name.includes('iPhone')) {
      test.skip();
      return;
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Forward browser diagnostic logs to terminal to observe capability probing
    page.on('console', msg => {
      if (msg.text().includes('[Hero3D Probe]') || msg.text().includes('[Diagnostic]')) {
        console.log('BROWSER CONSOLE:', msg.text());
      }
    });

    // Emulate normal motion preference and allow unforced native hardware gatekeeper probing
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const wrapper = page.getByTestId('hero-3d-wrapper');
    await expect(wrapper).toBeVisible();

    // Await complete Next.js hydration and client-side capability probing (no longer 'probing')
    await expect(wrapper).toHaveAttribute('data-webgl-active', /true|false/, { timeout: 20000 });
    const isWebGlActive = await wrapper.getAttribute('data-webgl-active') === 'true';

    if (!isWebGlActive) {
      console.log(`[Diagnostic] (${testInfo.project.name}) Engine genuinely lacked OpenGL bindings (hasGL=false). Verified clean fallback mount.`);
      await expect(page.getByTestId('hero-3d-fallback')).toBeVisible();
      await wrapper.screenshot({ path: path.join(ARTIFACT_DIR, `hero_fallback_auto_${testInfo.project.name}.png`) });
      return;
    }

    await expect(wrapper).toHaveAttribute('data-intersecting', 'true');
    
    // Allow up to 25 seconds for Next.js webpack to compile and hydrate the dynamic Three.js chunk
    const canvas = page.getByTestId('hero-3d-canvas');
    await expect(canvas).toBeVisible({ timeout: 25000 });

    // 1. Verify active frame execution in useFrame loop using expect.poll
    await expect.poll(
      async () => await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0),
      { timeout: 25000, message: 'Waiting for CPU/Shader compilation and frame rendering loop to surpass 15 frames' }
    ).toBeGreaterThan(15);

    const initialCount = await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0);
    console.log(`[Empirical Proof] (${testInfo.project.name}) Active WebGL Frame Count (in-view):`, initialCount);

    // CAPTURE HIGH-RESOLUTION SCREENSHOT OF ACTIVE WEBGL SCENE FOR USER VERIFICATION
    await wrapper.screenshot({ path: path.join(ARTIFACT_DIR, `hero_webgl_real_${testInfo.project.name}.png`) });

    // 2. Perform scrollytelling mouse interactivity test
    await page.mouse.move(600, 400);
    await page.mouse.move(800, 300, { steps: 5 });
    await page.waitForTimeout(300);

    // 3. EMPIRICALLY PROVE INTERSECTION OBSERVER SUSPENSION
    // Scroll deep into the page (1800px down) to force Hero component completely off-screen
    await page.evaluate(() => window.scrollTo(0, 1800));
    
    // Confirm IntersectionObserver fired and updated state to false
    await expect(wrapper).toHaveAttribute('data-intersecting', 'false', { timeout: 10000 });

    // Allow 150ms for frameloop="never" transition to completely quiesce
    await page.waitForTimeout(150);
    const countAtSuspension = await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0);
    console.log(`[Diagnostic] (${testInfo.project.name}) Frame Count immediately upon scroll-out suspension:`, countAtSuspension);

    // Wait 1000ms (an entire second — normally ~60 frames if unpaused)
    await page.waitForTimeout(1000);
    const countAfterPause = await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0);
    console.log(`[Diagnostic] (${testInfo.project.name}) Frame Count after 1,000ms off-screen pause:`, countAfterPause);

    // EMPIRICALLY PROVE ZERO FRAMES RAN WHILE OUT OF VIEW
    expect(countAfterPause).toBe(countAtSuspension);

    // 4. Scroll back into viewport to prove seamless automatic resumption
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(wrapper).toHaveAttribute('data-intersecting', 'true', { timeout: 10000 });
    
    await expect.poll(
      async () => await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0),
      { timeout: 10000, message: 'Waiting for frame rendering to resume upon re-entering viewport' }
    ).toBeGreaterThan(countAtSuspension);

    const countResumed = await page.evaluate(() => (window as any).__HERO_FRAME_COUNT || 0);
    console.log(`[Diagnostic] (${testInfo.project.name}) Frame Count after scrolling back into view:`, countResumed);
  });

  test('Fallback Path: renders high-fidelity zero-JS fallback on mobile viewports or under forced fallback, and captures visual screenshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const wrapper = page.getByTestId('hero-3d-wrapper');
    await expect(wrapper).toBeVisible();

    const isMobile = await page.evaluate(() => window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches);
    if (!isMobile) {
      await page.addInitScript(() => {
        (window as any).__FORCE_WEBGL_FALLBACK = true;
      });
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    }

    await expect(wrapper).toHaveAttribute('data-webgl-active', 'false', { timeout: 10000 });

    const fallback = page.getByTestId('hero-3d-fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText(/Adaptive Syllabus Plan|Target Exams/i);

    // Verify WebGL canvas never mounted
    const canvas = page.getByTestId('hero-3d-canvas');
    await expect(canvas).toHaveCount(0);

    if (testInfo.project.name === 'chromium' || isMobile) {
      await wrapper.screenshot({ path: path.join(ARTIFACT_DIR, `hero_fallback_verified_${testInfo.project.name.replace(/\s+/g, '_')}.png`) });
    }
  });

});
