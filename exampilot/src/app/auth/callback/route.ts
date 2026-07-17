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
    const successUrl = new URL(next, origin);
    // CRITICAL FIX: PWA Service Workers on Android often cache the Guest version of '/' 
    // and serve it even after login. Adding a timestamp query param forces a network hit.
    successUrl.searchParams.set("t", Date.now().toString());
    
    // Check User-Agent to determine if we need the HTML bouncer for Safari ITP
    const { headers, cookies } = require("next/headers");
    const userAgent = headers().get("user-agent") || "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (/Mac OS X/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));
    
    let res: NextResponse;

    if (isIOS) {
      // Fix for Safari/iOS ITP dropping cookies on 30x cross-site redirects: return a 200 OK HTML bouncer
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Authenticating...</title>
            <script>
              // 100ms delay ensures iOS has time to write the Set-Cookie headers to its store
              setTimeout(function() {
                window.location.replace("${successUrl.toString()}");
              }, 100);
            </script>
          </head>
          <body>
            <p>Redirecting you to the app...</p>
          </body>
        </html>
      `;
      res = new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    } else {
      // Standard HTTP 307 Redirect for Android/Windows/Chrome.
      // Android Chrome perfectly handles Set-Cookie on 30x redirects and avoids HTML parsing race conditions.
      res = NextResponse.redirect(successUrl);
    }

    // Instead of using the global createClient() which sets cookies on the incoming request context,
    // we instantiate a dedicated client here. This guarantees that the fully-hydrated cookie options 
    // (specifically `path: '/'` and `maxAge`) are injected directly into our outgoing response.
    const { createServerClient } = require("@supabase/ssr");
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure critical options like path are retained
              res.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set(
        "error",
        error.message.length < 200 ? error.message : "Session exchange failed. Please sign in again."
      );
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (unexpectedError: unknown) {
    // ── 4. Safety net: catches network timeouts, env-var misconfigurations, etc.
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
