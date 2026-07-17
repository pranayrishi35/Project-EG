import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  // Did the user already agree to terms on the login page?
  // The login page sets a short-lived `ep_consent_pending` cookie before navigating to Google.
  const consentPending = request.cookies.get("ep_consent_pending")?.value === "1";

  // ── 3. Build success redirect and create Supabase client ─────────────────────
  const successUrl = new URL(next, origin);
  const response = NextResponse.redirect(successUrl);

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

  // ── 4. Exchange the PKCE code for a session ───────────────────────────────────
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

    // ── 5. Auto-record consent if user agreed to terms on login page ─────────────
    if (consentPending && sessionData?.user) {
      try {
        const adminClient = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
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
      } catch (e) {
        // Non-fatal — don't block sign-in
        console.error("[/auth/callback] Consent upsert failed:", e);
      }

      // Set consent cookie directly on the redirect response
      response.cookies.set("consent_granted", "true", {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
      });
      // Clear the pending cookie
      response.cookies.set("ep_consent_pending", "", { maxAge: 0, path: "/" });
    }

    return response;
  } catch (unexpectedError: unknown) {
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
