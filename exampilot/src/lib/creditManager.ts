import { createClient } from "@supabase/supabase-js";
import { checkIsAdmin } from "./adminAuth";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Ensures the user profile exists. If not, initializes with 50 credits.
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
      .insert({ user_id: userId, credits: 500, tier: "beta" })
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

  const { data: profile, error: profileError } = await ensureUserProfile(userId);
  if (profileError || !profile) return { success: false, error: "SYSTEM_ERROR" };

  // Bypass check for admins (fallback check via tier)
  if (profile.tier === "admin") {
    return { success: true, remaining: profile.credits, bypassed: true };
  }

  if (profile.credits < cost) {
    return { success: false, error: "Beta Quota Reached. Thanks for testing! Premium features unlocking soon." };
  }

  const { data: updatedData, error: updateError } = await admin
    .from("user_profiles")
    .update({ credits: profile.credits - cost })
    .eq("user_id", userId)
    .select("credits")
    .single();

  if (updateError) return { success: false, error: "SYSTEM_ERROR" };

  return { success: true, remaining: updatedData.credits };
}
