import { createClient } from "@supabase/supabase-js";
import { checkIsAdmin } from "./adminAuth";
import { BETA_STARTING_CREDITS } from "./credits";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Ensures the user profile exists. If not, initializes with the beta grant.
 * Returns the profile data.
 */
async function ensureUserProfile(userId: string): Promise<{ data: any | null, error: string | null }> {
  const admin = getAdminClient();
  if (!admin) return { data: null, error: "SYSTEM_ERROR" };

  let { data, error } = await admin
    .from("user_profiles")
    .select("credits, tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const { data: newData, error: insertError } = await admin
      .from("user_profiles")
      .insert({ user_id: userId, credits: BETA_STARTING_CREDITS, tier: "beta" })
      .select("credits, tier")
      .single();
      
    if (insertError) return { data: null, error: "SYSTEM_ERROR" };
    data = newData;
  }

  return { data, error: null };
}

export async function getUserCredits(userId: string): Promise<number> {
  const { data } = await ensureUserProfile(userId);
  if (data) return data.credits;
  return 0; // Safe fallback
}

export async function checkAndDeductCredits(userId: string, userEmail: string | undefined, cost: number): Promise<{ success: boolean; remaining?: number; error?: string; bypassed?: boolean }> {
  if (userEmail && (await checkIsAdmin(userEmail))) {
    return { success: true, bypassed: true };
  }

  const admin = getAdminClient();
  if (!admin) return { success: false, error: "SYSTEM_ERROR" };

  // Ensure the profile exists (and seed it) before attempting the deduction.
  const { data: profile, error: profileError } = await ensureUserProfile(userId);
  if (profileError || !profile) return { success: false, error: "SYSTEM_ERROR" };

  // Bypass check for admins (fallback check via tier)
  if (profile.tier === "admin") {
    return { success: true, remaining: profile.credits, bypassed: true };
  }

  // Atomic check-and-deduct via RPC: the balance guard lives inside the UPDATE's
  // WHERE clause, so concurrent requests cannot double-spend (no TOCTOU race).
  // Returns the new balance, or NULL when the balance was insufficient.
  const { data: remaining, error: rpcError } = await admin.rpc("deduct_credits", {
    p_user_id: userId,
    p_cost: cost,
  });

  if (rpcError) return { success: false, error: "SYSTEM_ERROR" };

  if (remaining === null || remaining === undefined) {
    return { success: false, error: "Beta Quota Reached. Thanks for testing! Premium features unlocking soon." };
  }

  return { success: true, remaining: remaining as number };
}

/**
 * Refunds credits previously deducted for an operation that then failed
 * (e.g. the Gemini call errored after checkAndDeductCredits succeeded).
 *
 * Best-effort and safe to skip for admins/bypassed calls (they were never
 * charged). Uses a simple additive RPC so the increment is atomic; a refund
 * failure is logged but never surfaced to the user, since the original request
 * already failed and re-charging is the worse outcome.
 */
export async function refundCredits(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;

  const admin = getAdminClient();
  if (!admin) {
    console.error("[refundCredits] No admin client; cannot refund", { userId, amount });
    return;
  }

  const { error } = await admin.rpc("refund_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("[refundCredits] Refund failed:", error, { userId, amount });
  }
}
