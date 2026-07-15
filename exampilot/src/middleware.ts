import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: runs on every request before page rendering.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so it never expires mid-browsing.
 * 2. (Later) Protect routes — redirect unauthenticated users to /login.
 *
 * Keep this file as thin as possible — heavy logic belongs in Server Actions.
 */
/**
 * Tell Next.js to run this middleware in the Node.js runtime, NOT the Edge
 * runtime. @supabase/supabase-js uses process.version which is unavailable
 * in Edge — this export silences the build warning.
 */
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  // Guard: pass through silently when Supabase env vars are not configured yet
  // (e.g. during initial development before .env.local is created).
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated session cookies to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do NOT remove — this refreshes the session on every request.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const pathname = request.nextUrl.pathname;
    const isConsentRoute = pathname === '/consent';
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');
    const isLegalRoute = ['/terms', '/privacy', '/cookies', '/aup', '/refund-policy'].includes(pathname);
    const isApiRoute = pathname.startsWith('/api') || pathname.startsWith('/_next');

    if (!isConsentRoute && !isAuthRoute && !isLegalRoute && !isApiRoute) {
      // FAST PATH: Check if the cookie exists to avoid a 150ms+ database query on every page load
      if (!request.cookies.has("consent_granted")) {
        // SLOW PATH: Fallback to DB check (e.g. user logged in on a new device where cookie is missing)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('legal_consent_version')
          .eq('user_id', user.id)
          .single();
        
        if (!profile?.legal_consent_version) {
          const url = request.nextUrl.clone();
          url.pathname = '/consent';
          return NextResponse.redirect(url);
        } else {
          // User has consent in DB, but was missing the cookie. Set it now to speed up future requests!
          supabaseResponse.cookies.set("consent_granted", "true", { maxAge: 60 * 60 * 24 * 365, path: "/" });
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (icons, manifest, sw.js)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
