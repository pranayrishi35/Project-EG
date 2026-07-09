"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive the app's origin URL from request headers. */
function getOrigin(): string {
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// ─── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth sign-in.
 * Supabase returns a redirect URL to the Google consent screen.
 * Next.js `redirect()` sends the browser there immediately.
 *
 * Pre-requisite: Enable "Google" provider in
 * Supabase Dashboard → Authentication → Providers → Google.
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        // Request offline access so a refresh token is returned
        access_type: "offline",
        // Force account picker on each login
        prompt: "consent",
      },
    },
  });

  if (error) {
    // redirect() can't be called after a thrown error, so we return the message
    // and let the client display it.
    return { error: error.message };
  }

  if (data.url) {
    // This throws a special Next.js redirect — handled transparently.
    redirect(data.url);
  }
}

// ─── Magic Link (OTP) ─────────────────────────────────────────────────────────

/**
 * Sends a one-time magic link to the user's email.
 * On click, Supabase redirects to /auth/callback?code=... which exchanges
 * the code for a session.
 */
export async function signInWithOtp(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = createClient();
  const origin = getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Redirect after the user clicks the link in their email
      emailRedirectTo: `${origin}/auth/callback`,
      // Set to false so existing users are not auto-confirmed
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Signs the current user out and redirects to the login page.
 * Called from the SignOutButton client component.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
