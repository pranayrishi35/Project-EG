import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// This test verifies that the database schema actually supports the account deletion lifecycle.
// It creates a real test user, attempts the exact admin update used by deleteAccount.ts,
// and verifies it succeeds without throwing PGRST204 (column not found).
// It safely skips if the necessary environment variables are not provided (e.g. in some CI runs).
test('Backend Regression: Account deletion updates database successfully', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    test.skip(true, 'Missing Supabase environment variables. Skipping real backend regression test.');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const email = `test-regression-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  // 1. Create a real test user
  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
  });
  
  expect(authError).toBeNull();
  expect(authData.user).toBeDefined();
  
  const userId = authData.user!.id;

  try {
    // Wait for triggers to create profile if applicable
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Simulate the exact update from deleteAccount.ts
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 48);

    const { data: updated, error: updateError } = await admin
      .from("user_profiles")
      .update({
        is_deleted: true,
        deletion_deadline: deadline.toISOString(),
      })
      .eq("user_id", userId)
      .select("user_id");

    // 3. Assertions
    // If the schema is missing the columns, this will throw PGRST204
    expect(updateError).toBeNull();
    expect(updated).toBeDefined();
    expect(updated?.length).toBe(1);
    expect(updated![0].user_id).toBe(userId);

  } finally {
    // 4. Cleanup
    await admin.auth.admin.deleteUser(userId);
  }
});
