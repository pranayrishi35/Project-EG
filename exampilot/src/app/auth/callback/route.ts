import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth Callback Route Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase redirects the browser here after BOTH:
 *   • Google OAuth  →  ?code=<pkce_auth_code>
 *   • Magic Link    →  ?code=<pkce_auth_code>
 *
 * Flow (PKCE — Proof Key for Code Exchange):
 *   1. Our app generates a code_verifier (stored in a cookie by @supabase/ssr).
 *   2. Supabase returns a one-time `code` to this URL.
 *   3. We call exchangeCodeForSession(code) which sends the code + verifier
 *      to Supabase's token endpoint and receives JWT access + refresh tokens.
 *   4. @supabase/ssr writes those tokens as secure cookies.
 *   5. We redirect to the app — subsequent server renders are authenticated.
 *
 * Error surface:
 *   • User cancels Google consent     → ?error + ?error_description params
 *   • Code already used / expired     → exchangeCodeForSession returns error
 *   • No code at all                  → redirect to /login?error=auth-failed
 *   • Any unexpected throw            → caught, redirect to /login?error=...
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Allowed path prefixes for the ?next= redirect — prevents open redirects. */
function sanitiseNext(raw: string | null): string {
  if (!raw) return "/";
  // Only allow relative paths starting with / (reject http://, javascript:, etc.)
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // ── 1. Provider-level errors (e.g. user cancels Google consent) ─────────────
  const providerError = searchParams.get("error");
  const providerErrorDesc = searchParams.get("error_description");

  if (providerError) {
    const message =
      providerErrorDesc ??
      (providerError === "access_denied"
        ? "Sign-in was cancelled."
        : "Authentication error. Please try again.");

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Extract the one-time PKCE code ────────────────────────────────────────
  const code = searchParams.get("code");
  const next = sanitiseNext(searchParams.get("next"));

  if (!code) {
    // No code and no provider error — something unexpected happened
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Exchange code for session ─────────────────────────────────────────────
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Known failure: code expired, already used, verifier mismatch, etc.
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set(
        "error",
        error.message.length < 200
          ? error.message
          : "Session exchange failed. Please sign in again."
      );
      return NextResponse.redirect(loginUrl);
    }

    // ✅ Success — session cookies set by @supabase/ssr, send user to the app
    const successUrl = new URL(next, origin);
    return NextResponse.redirect(successUrl);
  } catch (unexpectedError: unknown) {
    // ── 4. Safety net: catches network timeouts, env-var misconfigurations, etc.
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
