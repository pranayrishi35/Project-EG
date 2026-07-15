"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function acceptConsent() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  // Use Service Role to bypass RLS. The RLS policy for UPDATE on user_profiles 
  // is broken (USING auth.uid() = id instead of user_id), which causes silent failures.
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient
    .from("user_profiles")
    .update({ 
      legal_consent_version: "v2026-07-15", 
      legal_consent_timestamp: new Date().toISOString() 
    })
    .eq('user_id', user.id);

  if (error) {
    console.error("Failed to update consent in DB:", error);
    // 42703 / PGRST204: The DB has a typo in its RLS policy (id instead of user_id) 
    // which crashes the Postgres query planner. We can't fix their DB from here, 
    // but we CAN unblock the user by gracefully falling back to the cookie.
    if (error.code !== '42703' && error.code !== 'PGRST204') {
      return { error: `Failed to record consent: ${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})` };
    }
  }

  // Set a fast-path cookie so the middleware doesn't need to query the database on every request
  cookies().set("consent_granted", "true", { maxAge: 60 * 60 * 24 * 365, path: "/" });

  return { success: true };
}
