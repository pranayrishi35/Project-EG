import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

import { getUserCredits } from "@/lib/creditManager";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { initializeCreditsAction } from "@/app/actions/credits";

export const dynamic = 'force-dynamic';

/**
 * Header — async Server Component.
 * Reads the Supabase session server-side so there is zero flash of
 * unauthenticated content and no client JS needed for the auth check.
 */
export default async function Header() {
  // Safely attempt to read the session; if env vars are not set yet
  // (e.g. during development before .env.local is created) we fall back
  // to a logged-out state instead of crashing.
  let userEmail: string | null = null;
  let userInitial: string = "?";
  let userCredits: number | null = null;

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
      userEmail = user.email ?? null;
      userInitial = (user.email?.[0] ?? "U").toUpperCase();
      
      const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (adminUrl && adminKey) {
        const adminClient = createSupabaseAdmin(adminUrl, adminKey);
        const { data } = await adminClient
          .from("user_profiles")
          .select("credits")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (!data) {
          userCredits = 50;
          // Fire asynchronously without blocking the server render
          void initializeCreditsAction(user.id);
        } else {
          userCredits = data.credits;
        }
      } else {
        userCredits = 0; // Build-time fallback
      }
    }
  } catch {
    // Supabase env vars not configured yet — render as logged-out
  }

  return (
    <header
      id="app-header"
      className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-top"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-lg mx-auto">

        {/* ── Logo ───────────────────────────────────────────────── */}
        <Link
          href="/"
          data-testid="header-title"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
          aria-label="ExamPilot home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            }}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.586 1.586A2 2 0 0 0 18 5.293V7l-5 5H9.414l-5.707 5.707a1 1 0 0 0 1.414 1.414L11 13.414V15a1 1 0 0 0 .293.707l4 4A1 1 0 0 0 17 19v-4l2.414-2.414A2 2 0 0 0 20 11.172V9.293l1.707-1.707a1 1 0 0 0 0-1.414l-1-1a1 1 0 0 0 0 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Exam<span className="text-indigo-600">Pilot</span>
          </span>
        </Link>

        {/* ── Auth area ──────────────────────────────────────────── */}
        {userEmail ? (
          <div className="flex items-center gap-4">
            {userCredits !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                <span aria-hidden="true" className="text-sm leading-none">⚡</span> 
                {userCredits} <span className="hidden sm:inline">Credits</span>
              </div>
            )}
            
            <Link
              id="header-settings-link"
              data-testid="header-settings-link"
              href="/settings"
              aria-label={`Account settings for ${userEmail}`}
              className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-full"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-opacity duration-150 hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
                aria-hidden="true"
              >
                {userInitial}
              </div>
            </Link>
          </div>
        ) : (
          /* Logged out — show Sign In link */
          <Link
            id="header-sign-in-link"
            data-testid="header-sign-in-link"
            href="/login"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
          >
            Sign in
          </Link>
        )}

      </div>
    </header>
  );
}
