import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Reusable server-side utility to enforce email verification.
 * 
 * Checks the Supabase user's `email_confirmed_at` property.
 * If the user's email is not confirmed, this function will automatically 
 * throw a redirect to the `/please-verify` screen.
 * 
 * Usage in a Server Component or Server Action:
 * ```ts
 * await checkEmailVerified();
 * ```
 */
export async function checkEmailVerified() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If no user exists, let the standard auth guards handle it, or redirect to login.
  if (error || !user) {
    redirect("/login");
  }

  // Enforce email verification
  if (!user.email_confirmed_at) {
    redirect("/please-verify");
  }

  return user;
}
