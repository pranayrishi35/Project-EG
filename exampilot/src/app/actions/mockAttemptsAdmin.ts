"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMockAttempt(attemptId: string) {
  const supabase = createClient();

  // 1. Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Check admin whitelist
  const { data: adminData, error: adminError } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", user.email)
    .single();

  if (adminError || !adminData) {
    return { success: false, error: "Forbidden: Admin access required." };
  }

  // 3. Delete the mock attempt
  const { error: deleteError } = await supabase
    .from("mock_attempts")
    .delete()
    .eq("id", attemptId);

  if (deleteError) {
    console.error("Failed to delete mock attempt:", deleteError);
    return { success: false, error: deleteError.message };
  }

  // 4. Revalidate admin page
  revalidatePath("/admin");
  return { success: true };
}

export async function getMockAttempts() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, data: [] };

  const { data: adminData, error: adminError } = await supabase
    .from("admin_whitelist")
    .select("email")
    .eq("email", user.email)
    .single();

  if (adminError || !adminData) return { success: false, data: [] };

  const { data, error } = await supabase
    .from("mock_attempts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch mock attempts:", error);
    return { success: false, data: [] };
  }

  return { success: true, data };
}
