import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";


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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
      cookieOptions: {
        domain: request.headers.get('host')?.split(':')[0] ?? undefined,
        path: '/',
        sameSite: 'Lax',
        secure: false,
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

    // Do NOT set consent_granted cookie here; consent is recorded via /consent page.

    return response;
  } catch (unexpectedError: unknown) {
    console.error("[/auth/callback] Unexpected error:", unexpectedError);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "An unexpected error occurred. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
