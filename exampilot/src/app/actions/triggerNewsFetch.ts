"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/adminAuth";

export async function triggerNewsFetch() {
  const supabase = createClient();
  
  // Strict admin check (only logged-in admins can trigger this via UI)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !(await checkIsAdmin(user.email))) {
    return { success: false, error: "Unauthorized access." };
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { success: false, error: "CRON_SECRET is not configured on the server." };
  }

  // Construct the absolute URL to hit the API route
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = `${protocol}://${host}/api/cron/fetch-news?secret=${secret}`;

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to trigger API route" };
  }
}
