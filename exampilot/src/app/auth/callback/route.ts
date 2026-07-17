import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth Callback Route Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase redirects the browser here after BOTH:
 *   • Google OAuth  →  ?code=<pkce_auth_code>
 *   • Magic Link    →  ?code=<pkce_auth_code>
 *
 * This uses the exact pattern recommended by Supabase's own SSR docs:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * The key insight: We create the NextResponse.redirect FIRST, then pass
 * its cookie jar to the Supabase client so cookies are written directly
 * into the redirect response headers — no second step needed.
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

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Build the success redirect response FIRST ─────────────────────────────
  // We build the redirect response before calling exchangeCodeForSession so
  // that the Supabase client can write session cookies directly into it.
  // This is the only reliable pattern that works across iOS Safari, Android
  // Chrome, and desktop browsers.
  const successUrl = new URL(next, origin);
  
  // Create the response we'll actually return
  const response = NextResponse.redirect(successUrl);

  // ── 4. Create Supabase client that writes cookies into our response ───────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read incoming cookies from the request (needed for PKCE code_verifier)
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write session cookies directly into the outgoing redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ── 5. Exchange the PKCE code for a session ───────────────────────────────────
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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

    // ✅ Session cookies are now in `response` — redirect the user to the app
    return response;
  } catch (unexpectedError: unknown) {
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
