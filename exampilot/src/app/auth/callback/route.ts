import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Auth Callback Route Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles both Google OAuth and Magic Link callbacks.
 *
 * Key fix: We auto-record consent here if `?consent=granted` is in the URL
 * (set by the login page when the user checks the terms checkboxes).
 * This eliminates the post-login /consent redirect which caused the
 * Android sign-in loop.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function sanitiseNext(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // ── 1. Provider-level errors ─────────────────────────────────────────────────
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
  const consentGranted = searchParams.get("consent") === "granted";

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Build the success redirect response FIRST ─────────────────────────────
  // The Supabase client writes session cookies directly into this response.
  const successUrl = new URL(next, origin);
  // Mark that consent was already handled so middleware skips the /consent redirect
  if (consentGranted) {
    successUrl.searchParams.set("consent_done", "1");
  }
  const response = NextResponse.redirect(successUrl);

  // ── 4. Create Supabase client writing cookies into the response ───────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ── 5. Exchange the PKCE code for a session ───────────────────────────────────
  try {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set(
        "error",
        error.message.length < 200
          ? error.message
          : "Session exchange failed. Please sign in again."
      );
      return NextResponse.redirect(loginUrl);
    }

    // ── 6. Auto-record consent if user agreed on the login page ──────────────────
    // This eliminates the /consent redirect loop that trapped mobile users.
    if (consentGranted && sessionData?.user) {
      try {
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Upsert so it works even if user_profiles row doesn't exist yet
        await adminClient
          .from("user_profiles")
          .upsert(
            {
              user_id: sessionData.user.id,
              legal_consent_version: "v2026-07-15",
              legal_consent_timestamp: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch (consentErr) {
        // Non-fatal — don't block the user from logging in
        console.error("[/auth/callback] Consent recording failed:", consentErr);
      }

      // Set the consent cookie directly on the redirect response
      // so middleware's fast-path check passes immediately
      response.cookies.set("consent_granted", "true", {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        httpOnly: false, // Must be readable by middleware (not client JS)
        sameSite: "lax",
      });
    }

    // ✅ Session cookies + consent cookie are now in the response
    return response;
  } catch (unexpectedError: unknown) {
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
