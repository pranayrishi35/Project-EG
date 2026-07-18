import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "15 m"),
  analytics: true,
});

/**
 * Middleware: runs on every request before page rendering.
 *
 * Responsibilities:
 * 1. Rate-limit auth endpoints (/login, /signup, /reset-password) using Upstash
 * 2. Refresh the Supabase session cookie so it never expires mid-browsing.
 */
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Guard: Rate Limit Auth Routes (Sliding Window 5 req / 15m)
  const isAuthRouteForLimit = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/reset-password');
  
  if (isAuthRouteForLimit) {
    // Only rate-limit actual submission attempts, not page loads
    if (request.method !== 'GET') {
      if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        // Skip rate limiting in local dev if Vercel KV is not configured
      } else {
        // Extract IP. Fallbacks for proxies/Vercel/local
        const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
        const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
        
        if (!success) {
          return new NextResponse(
            JSON.stringify({ error: "Too Many Requests", message: "You have exceeded the rate limit for authentication." }),
            { 
              status: 429, 
              headers: { 
                "Content-Type": "application/json",
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString()
              } 
            }
          );
        }
      }
    }
  }

  // Guard: pass through silently when Supabase env vars are not configured yet
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
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          // Supabase sets cookies on the response only; no mutation of the request
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      },
    }
  );

  // IMPORTANT: do NOT remove — this refreshes the session on every request.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  let user = null;
  // Only attempt to get a user if a Supabase auth cookie is present
  const hasSupabaseCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  if (hasSupabaseCookie) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      // Ignore refresh token errors – treat as unauthenticated
      user = null;
    }
  }


  if (user) {
    const pathname = request.nextUrl.pathname;
    
    const isConsentRoute = pathname === '/consent';
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');
    const isLegalRoute = ['/terms', '/privacy', '/cookies', '/aup', '/refund-policy'].includes(pathname);
    const isApiRoute = pathname.startsWith('/api') || pathname.startsWith('/_next');
    // Home page is public (shows either guest or user content) — never force consent redirect from /
    const isHomePage = pathname === '/';

    if (!isConsentRoute && !isAuthRoute && !isLegalRoute && !isApiRoute && !isHomePage) {
      // Only rely on the fast-path client cookie. No heavy database 'select' in middleware.
      if (!request.cookies.has("consent_granted")) {
        const url = request.nextUrl.clone();
        url.pathname = '/consent';
        return NextResponse.redirect(url);
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
