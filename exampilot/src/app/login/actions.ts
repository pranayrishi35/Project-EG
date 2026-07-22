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

// ─── Password Sign In / Sign Up (DevSecOps) ───────────────────────────────────

/**
 * Single entry point for the password form, which is labelled
 * "Sign In / Create Account". Because Supabase has distinct sign-in and
 * sign-up primitives, we implement both here:
 *
 *   1. Try `signInWithPassword` first — this is the common case (returning user)
 *      and, on success, establishes a session via the SSR cookie writer.
 *   2. If sign-in fails ONLY because no such account exists (or the credentials
 *      don't match a confirmed account), fall back to `signUp` to create one.
 *
 * `signUp` alone can NOT log an existing user in (it returns a sessionless
 * fake-success for known emails), which is why a sign-in attempt must come
 * first for the "Sign In" half of the label to actually work.
 *
 * Returns:
 *   { success: true }              → session established (existing user signed in)
 *   { success: true, pending }     → new account created, email verification sent
 *   { error }                      → surfaced to the form
 */
export async function signUpWithPassword(
  _prevState: { error?: string; success?: boolean; pending?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; pending?: boolean }> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  // Server-side minimum length enforcement. The client form also checks this,
  // but that guard is bypassable (direct action invocation / disabled JS), so
  // the authoritative check lives here. Keep this threshold in sync with the
  // client-side check in login/page.tsx (currently 8).
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createClient();
  const origin = getOrigin();

  // ── 1. Attempt sign-in first (returning user) ──
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    // Session established via the SSR cookie writer.
    return { success: true };
  }

  // Only fall back to sign-up when the failure is "no matching credentials".
  // Any other error (rate limit, network, etc.) should surface as-is so we
  // don't mask real problems or silently attempt account creation.
  const isInvalidCredentials =
    signInError.code === "invalid_credentials" ||
    signInError.message.toLowerCase().includes("invalid login credentials");

  if (!isInvalidCredentials) {
    return { error: signInError.message };
  }

  // ── 2. Fall back to sign-up (new account) ──
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (signUpError) {
    // Specifically catching the HIBP / weak password error from Supabase
    if (signUpError.code === "weak_password" || signUpError.message.toLowerCase().includes("breach") || signUpError.message.toLowerCase().includes("pwned")) {
       return { error: "BREACHED_PASSWORD: This password has appeared in a known data breach. Please choose a different, secure password." };
    }
    return { error: signUpError.message };
  }

  // Supabase obfuscates "email already registered" by returning a user with an
  // empty identities array and no session. That means the email exists but the
  // password we tried didn't match — i.e. a genuine wrong-password sign-in.
  const identities = signUpData.user?.identities;
  if (identities && identities.length === 0) {
    return { error: "Incorrect password. If you have an account, try again or use a magic link." };
  }

  // New account created — email verification required before a session exists.
  return { success: true, pending: true };
}
