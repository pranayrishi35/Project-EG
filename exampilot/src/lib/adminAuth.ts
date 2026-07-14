import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

export async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
  noStore();
  
  if (!email) return false;
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("[ADMIN CHECK FATAL ERROR]: Missing SUPABASE_SERVICE_ROLE_KEY or URL");
      return false;
    }

    const admin = createClient(url, key);
    
    const { data, error } = await admin
      .from("admin_whitelist")
      .select("email")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("[ADMIN CHECK FATAL ERROR]:", error);
      return false;
    }
    
    const result = !!data;
    console.log("[ADMIN CHECK] Result for", email, ":", result);
    return result;
  } catch (err) {
    console.error("[ADMIN CHECK FATAL ERROR]:", err);
    return false;
  }
}
