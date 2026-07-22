import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Bypass TLS issues in local CI/Playwright environments when hitting Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// E2E Test: Full User Flow for Account Deletion
test.describe('Account Deletion E2E Flow', () => {
  let userId: string;
  let adminClient: any;
  let sessionStr: string;

  test.beforeAll(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Skip if we don't have the keys
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) return;
    
    adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const client = createClient(supabaseUrl, supabaseAnonKey);
    
    const testEmail = `e2e-delete-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // 1. Create a real user that is auto-confirmed (bypassing email confirmation)
    const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (adminError) throw adminError;
    userId = adminData.user.id;

    // 2. Sign in via API to get real JWTs
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) throw authError;

    // 3. Serialize the session to exactly match what the Supabase SSR client expects in the cookie
    sessionStr = JSON.stringify({
      access_token: authData.session.access_token,
      token_type: authData.session.token_type,
      expires_in: authData.session.expires_in,
      expires_at: authData.session.expires_at,
      refresh_token: authData.session.refresh_token,
      user: authData.user
    });
  });

  test.afterAll(async () => {
    if (adminClient && userId) {
      await adminClient.auth.admin.deleteUser(userId);
    }
  });

  test('User can log in, schedule deletion, and see the success banner', async ({ context, page }) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      test.skip(true, 'Missing Supabase environment variables');
      return;
    }

    // Parse the project ref from the URL to set the exact cookie name the client expects
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const projectRef = url.hostname.split('.')[0];

    // Inject the REAL auth session into the browser cookies
    await context.addCookies([
      {
        name: `sb-${projectRef}-auth-token`,
        value: encodeURIComponent(sessionStr),
        domain: 'localhost',
        path: '/',
      },
      {
        name: `sb-${projectRef}-auth-token`,
        value: encodeURIComponent(sessionStr),
        domain: '127.0.0.1',
        path: '/',
      }
    ]);

    // Hide Reticle overlay to prevent click interception
    await page.addStyleTag({ content: '[data-reticle-overlay] { display: none !important; pointer-events: none !important; }' });

    // 1. Go directly to settings (bypassing login UI since we injected the cookie)
    await page.goto('/settings');

    // Verify we are logged in (not redirected to /login)
    await expect(page).toHaveURL(/\/settings/);

    // 2. Initiate Deletion
    const deleteBtn = page.getByRole('button', { name: 'Delete Account' });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // 3. Confirm Deletion
    const confirmBtn = page.getByRole('button', { name: 'Yes, delete' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 4. Verify Redirect and Banner (This proves the server action succeeded against the DB)
    await expect(page).toHaveURL(/\/login/);
    
    const successBanner = page.getByText('Your account has been successfully scheduled for deletion');
    await expect(successBanner).toBeVisible();
  });
});
