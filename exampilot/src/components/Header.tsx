import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

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

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? null;
      userInitial = (user.email?.[0] ?? "U").toUpperCase();
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
      <div className="flex items-center justify-between h-full px-4 max-w-lg mx-auto">

        {/* ── Logo ───────────────────────────────────────────────── */}
        <Link
          href="/"
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
          /* Logged in — avatar links to /settings */
          <Link
            id="header-settings-link"
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
        ) : (
          /* Logged out — show Sign In link */
          <Link
            id="header-sign-in-link"
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
