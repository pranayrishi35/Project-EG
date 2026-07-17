import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
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
  // Write updated session cookies to both the request and the response
          // Write updated session cookies to both the request and the response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            // Options applied to response later
          });

          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            })
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
    
    // Check deletion status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_deleted, deletion_deadline, legal_consent_version')
      .eq('user_id', user.id)
      .single();

    if (profile?.is_deleted) {
      if (profile.deletion_deadline) {
        const deadline = new Date(profile.deletion_deadline);
        if (Date.now() < deadline.getTime()) {
          // In grace window -> force to /settings/recover
          if (pathname !== '/settings/recover' && !pathname.startsWith('/api')) {
            const url = request.nextUrl.clone();
            url.pathname = '/settings/recover';
            return NextResponse.redirect(url);
          }
        } else {
          // Past deadline -> deny all access
          await supabase.auth.signOut();
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('account', 'permanently-deleted');
          return NextResponse.redirect(url);
        }
      }
    }

    const isConsentRoute = pathname === '/consent';
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');
    const isLegalRoute = ['/terms', '/privacy', '/cookies', '/aup', '/refund-policy'].includes(pathname);
    const isApiRoute = pathname.startsWith('/api') || pathname.startsWith('/_next');

    if (!isConsentRoute && !isAuthRoute && !isLegalRoute && !isApiRoute && !profile?.is_deleted) {
      // FAST PATH: Check if the cookie exists to avoid a 150ms+ database query on every page load
      if (!request.cookies.has("consent_granted")) {
        // SLOW PATH: Use the profile fetched above
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
