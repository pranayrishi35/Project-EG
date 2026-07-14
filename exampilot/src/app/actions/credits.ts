"use server";

import { createClient } from "@supabase/supabase-js";

export async function initializeCreditsAction(userId: string) {
  console.log("Attempting to initialize credits for:", userId);
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or URL");
    return 50; // Safe optimistic fallback
  }
  
  const admin = createClient(url, key);
  
  try {
    const { data, error } = await admin
      .from("user_profiles")
      .insert({ user_id: userId, credits: 50, tier: "beta" })
      .select("credits")
      .single();

    if (error) {
      console.error("Supabase Admin Insert Failed:", error);
      return 50; 
    }
    return data.credits;
  } catch (err) {
    console.error("Supabase Admin Insert Failed (Exception):", err);
    return 50;
  }
}
