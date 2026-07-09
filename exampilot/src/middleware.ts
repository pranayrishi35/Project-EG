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
  await supabase.auth.getUser();

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
