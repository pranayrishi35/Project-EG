"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { BETA_STARTING_CREDITS } from "@/lib/credits";

export async function initializeCreditsAction() {
  const supabase = createServerClient();

  // Derive the user from the authenticated session — never trust a client-supplied id.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("UNAUTHORIZED");

  const userId = user.id;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or URL");
    return BETA_STARTING_CREDITS; // Safe optimistic fallback
  }

  const admin = createClient(url, key);

  try {
    // Upsert on user_id so re-invocation can never reset an existing balance.
    // ignoreDuplicates keeps the existing row untouched when the profile already exists.
    const { error: upsertError } = await admin
      .from("user_profiles")
      .upsert(
        { user_id: userId, credits: BETA_STARTING_CREDITS, tier: "beta" },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    if (upsertError) {
      console.error("Supabase Admin Upsert Failed:", upsertError);
      return BETA_STARTING_CREDITS;
    }

    // Return the authoritative current balance (existing or freshly seeded).
    const { data, error: selectError } = await admin
      .from("user_profiles")
      .select("credits")
      .eq("user_id", userId)
      .single();

    if (selectError || !data) {
      console.error("Supabase Admin Select Failed:", selectError);
      return BETA_STARTING_CREDITS;
    }
    return data.credits;
  } catch (err) {
    console.error("Supabase Admin Init Failed (Exception):", err);
    return BETA_STARTING_CREDITS;
  }
}
