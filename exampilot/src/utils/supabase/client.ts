import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use inside Client Components ("use client").
 *
 * Call this function directly inside the component — do NOT instantiate it
 * at module level to avoid sharing state across users in SSR environments.
 *
 * Usage:
 *   const supabase = createClient();
 *   const { data } = await supabase.from("study_plans").select("*");
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
