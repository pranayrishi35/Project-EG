import { createClient } from "@supabase/supabase-js";

/**
 * Constructs a Supabase client using the SERVICE_ROLE_KEY.
 * This bypasses Row Level Security (RLS).
 * MUST ONLY BE USED IN SERVER ACTIONS / BACKEND CODE.
 */
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key in environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}
