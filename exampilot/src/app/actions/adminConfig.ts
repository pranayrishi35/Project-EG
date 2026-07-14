"use server";

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AppConfig {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SystemInsights {
  profiles: number;
  studyPlans: number;
  questions: number;
}

/**
 * Internal helper to enforce Zero-Day Admin Verification.
 * Returns true if the user is a verified admin, otherwise throws.
 */
async function verifyAdmin(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) {
    throw new Error("Unauthorized access.");
  }

  const { data, error } = await supabase
    .from("admin_whitelist")
    .select("email")
    .ilike("email", user.email)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Access Denied: You do not have admin privileges.");
  }

  return true;
}

export async function getAppConfig(): Promise<{ success: boolean; data?: AppConfig[]; error?: string }> {
  const supabase = createClient();
  
  try {
    await verifyAdmin(supabase);
    
    const { data, error } = await supabase
      .from("app_config")
      .select("*")
      .order("key", { ascending: true });

    if (error) throw error;
    
    return { success: true, data: data as AppConfig[] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateAppConfig(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    await verifyAdmin(supabase);

    const { error } = await supabase
      .from("app_config")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function getSystemInsights(): Promise<{ success: boolean; data?: SystemInsights; error?: string }> {
  const supabase = createClient();
  
  try {
    await verifyAdmin(supabase);

    // Run parallel counts for performance
    const [profilesCount, plansCount, questionsCount] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("study_plans").select("*", { count: "exact", head: true }),
      supabase.from("question_bank").select("*", { count: "exact", head: true }),
    ]);

    return { 
      success: true, 
      data: {
        profiles: profilesCount.count || 0,
        studyPlans: plansCount.count || 0,
        questions: questionsCount.count || 0,
      } 
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
