import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

import { getUserCredits } from "@/lib/creditManager";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { initializeCreditsAction } from "@/app/actions/credits";
import { getStreak } from "@/app/actions/getStreak";
import { BETA_STARTING_CREDITS, LOW_CREDIT_THRESHOLD } from "@/lib/credits";

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
  let upcomingExam: { name: string; daysLeft: number } | null = null;
  let streak: number = 0;

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? null;
      userInitial = (user.email?.[0] ?? "U").toUpperCase();
      
      const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (adminUrl && adminKey) {
        const adminClient = createSupabaseAdmin(adminUrl, adminKey);

        // Fetch credits, upcoming exam, and streak concurrently — these are
        // independent reads and were previously awaited one after another,
        // serializing three round-trips into the header's render path.
        const todayStr = new Date().toISOString().split('T')[0];
        const [profileRes, plansRes, streakVal] = await Promise.all([
          adminClient
            .from("user_profiles")
            .select("credits")
            .eq("user_id", user.id)
            .maybeSingle(),
          adminClient
            .from("study_plans")
            .select("exam_name, exam_date")
            .eq("user_id", user.id)
            .gte("exam_date", todayStr)
            .order("exam_date", { ascending: true })
            .limit(1)
            .maybeSingle(),
          getStreak(),
        ]);

        // 1. Credits
        const profileData = profileRes.data;
        if (!profileData) {
          userCredits = BETA_STARTING_CREDITS;
          // Fire asynchronously without blocking the server render
          void initializeCreditsAction();
        } else {
          userCredits = profileData.credits;
        }

        // 2. Nearest upcoming exam from active study_plans
        const plansData = plansRes.data;
        if (plansData && plansData.exam_date) {
          const examDateObj = new Date(plansData.exam_date);
          const todayObj = new Date();
          examDateObj.setHours(0,0,0,0);
          todayObj.setHours(0,0,0,0);
          const diffTime = Math.max(0, examDateObj.getTime() - todayObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          upcomingExam = { name: plansData.exam_name, daysLeft: diffDays };
        }

        // 3. Streak (resolved above)
        streak = streakVal;
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
      className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-100 safe-top w-full"
      style={{ height: "var(--header-height)" }}
    >
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">

        {/* ── Logo ───────────────────────────────────────────────── */}
        <Link
          href="/"
          data-testid="header-title"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg shrink-0"
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
          <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block">
            Exam<span className="text-indigo-600">Pilot</span>
          </span>
        </Link>

        {/* ── Auth area ──────────────────────────────────────────── */}
        {userEmail ? (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pl-4">
            <a 
              href="mailto:support@exampilot.in?subject=[Beta%20Feedback]%20ExamPilot"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 bg-amber-100 border-[0.5px] border-amber-200 rounded-full text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 outline-none whitespace-nowrap shrink-0"
            >
              <span aria-hidden="true" className="text-sm leading-none flex-shrink-0">💬</span> 
              Give Feedback
            </a>
            
            {upcomingExam && (
              <div className="flex items-center gap-1.5 h-9 px-3.5 bg-orange-50 border-[0.5px] border-orange-200 rounded-full text-xs font-bold text-orange-700 shadow-sm transition-colors whitespace-nowrap shrink-0">
                <span aria-hidden="true" className="text-sm leading-none flex-shrink-0">🔥</span>
                {upcomingExam.daysLeft === 0 ? `Today is ${upcomingExam.name}!` : `${upcomingExam.daysLeft} Days to ${upcomingExam.name}`}
              </div>
            )}
            
            {userCredits !== null && (
              <div className={`flex items-center gap-1.5 h-9 px-3.5 border-[0.5px] rounded-full text-xs font-bold shadow-sm transition-colors whitespace-nowrap shrink-0 ${
                userCredits < LOW_CREDIT_THRESHOLD
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-indigo-50 border-indigo-100 text-indigo-600"
              }`}>
                <span aria-hidden="true" className="text-sm leading-none flex-shrink-0">
                  {userCredits < LOW_CREDIT_THRESHOLD ? "⚠️" : "⚡"}
                </span> 
                {userCredits} <span className="hidden sm:inline">Credits</span>
              </div>
            )}

            {streak > 0 && (
              <div className="flex items-center gap-1.5 h-9 px-3.5 bg-indigo-50 border-[0.5px] border-indigo-100 rounded-full text-xs font-bold text-orange-600 shadow-sm whitespace-nowrap shrink-0">
                <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">🔥</span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {streak}
                </span> 
                Day Streak
              </div>
            )}
            
            <Link
              id="header-settings-link"
              data-testid="header-settings-link"
              href="/settings"
              aria-label={`Account settings for ${userEmail}`}
              className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-full shrink-0 ml-1"
            >
              <div
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold transition-opacity duration-150 hover:opacity-80"
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
