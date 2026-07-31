import { getStreak } from "@/app/actions/getStreak";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
// Removed OnboardingTrigger import
import GuestAttemptBridge from "@/components/GuestAttemptBridge";
import { BookOpen, Target, Newspaper, BookMarked, Zap, Map, Plane, Check, Hourglass } from "lucide-react";
import TejasSpotlight from "@/components/TejasSpotlight";
import GuestLanding from "@/components/landing/GuestLanding";

const CreatePlanForm = dynamic(() => import("@/components/CreatePlanForm"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-50 rounded-2xl animate-pulse" />
});

export const metadata: Metadata = {
  title: "Jishnu — AI Study Planner",
  description:
    "Upload your syllabus and get a personalised day-by-day study schedule powered by Gemini AI.",
};

// --- Isolated Data Loaders ---

async function FlashcardStatusLoader() {
  const supabase = createClient();

  // These run during SSR inside a <Suspense> boundary. If any Supabase call
  // rejects (e.g. a transient network/DNS failure to the DB), an unhandled
  // throw here aborts the boundary with "The server could not finish this
  // Suspense boundary". We degrade to rendering nothing instead — the daily
  // flashcards CTA is non-critical, so a blip should never crash the page.
  let isCompleted = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if they have an active plan
    const { data: plan } = await supabase
      .from("study_plans")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) return null; // No plan, no flashcards

    // IST Date calculation matching getStreak
    const getISTDateString = (date: Date) => {
      const istDate = new Date(date.getTime() + 330 * 60 * 1000);
      return istDate.toISOString().split("T")[0];
    };
    const todayIST = getISTDateString(new Date());

    const { data: cached } = await supabase
      .from("daily_flashcards")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_id", plan.id)
      .eq("generated_date", todayIST)
      .maybeSingle();

    isCompleted = !!cached;
  } catch (err) {
    console.error("[FlashcardStatusLoader] Supabase call failed during SSR:", err);
    return null; // Fail soft: hide the CTA rather than crash the Suspense boundary.
  }

  if (isCompleted) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Check size={20} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">Daily Flashcards Complete</h3>
            <p className="text-xs text-emerald-700">Great job staying sharp today!</p>
          </div>
        </div>
        <Link href="/flashcards" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
          Review Again
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-3xl p-6 shadow-sm animate-fade-in relative overflow-hidden">
      <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none" aria-hidden="true">
        <Zap size={96} strokeWidth={1} className="text-brand-accent-500" />
      </div>
      <div className="flex items-center gap-4 z-10 w-full sm:w-auto text-center sm:text-left">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mx-auto sm:mx-0">
          <Zap size={28} strokeWidth={1.75} className="text-brand-accent-500" />
        </div>
        <div>
          <h3 className="text-lg font-black text-amber-900">Daily Flashcards Ready</h3>
          <p className="text-sm text-amber-700 font-medium">Your spaced repetition deck for today is generated.</p>
        </div>
      </div>
      <Link href="/flashcards" className="z-10 w-full sm:w-auto ep-btn-primary shadow-amber-200/50 flex-shrink-0 text-center">
        Start Session
      </Link>
    </div>
  );
}

async function RecentPlansLoader() {
  const supabase = createClient();

  // Guarded for the same reason as FlashcardStatusLoader: a transient Supabase
  // failure during SSR must not abort the Suspense boundary. On error we treat
  // it as "no plans" and render the existing empty state.
  let plans: any[] = [];
  try {
    const { data: recentPlans } = await supabase
      .from("study_plans")
      .select("id, exam_name, exam_date, generated_plan")
      .order("created_at", { ascending: false })
      .limit(2);
    plans = recentPlans || [];
  } catch (err) {
    console.error("[RecentPlansLoader] Supabase call failed during SSR:", err);
    plans = [];
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center flex-1 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
        <span className="mb-4 opacity-50" aria-hidden="true"><Plane size={40} strokeWidth={1.75} /></span>
        <p className="text-base font-bold text-gray-700">No active plans</p>
        {/* LIGHTHOUSE FIX: WCAG Contrast Ratio - Upgraded gray-500 to slate-700 */}
        <p className="text-sm text-slate-700 mt-1 max-w-sm">Generate your first study plan below to get your personalized daily mission targets.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {plans.map((plan) => {
        const weeks = plan.generated_plan?.weeks || [];
        const totalTopics = weeks.reduce((acc: number, w: { days: { topics: unknown[] }[] }) => acc + w.days.reduce((a: number, d: { topics: unknown[] }) => a + d.topics.length, 0), 0);
        const completed = plan.generated_plan?.completed_topics?.length || 0;
        const progress = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

        return (
          <Link
            key={plan.id}
            href={`/planner/${plan.id}`}
            className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 hover:border-brand-accent-500 hover:bg-amber-50/30 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-black text-gray-900 truncate group-hover:text-brand-accent-600 transition-colors">
                  {plan.exam_name}
                </p>
                {/* LIGHTHOUSE FIX: WCAG Contrast Ratio */}
                <p className="text-xs text-slate-700 font-bold uppercase tracking-wider mt-1">
                  {new Date(plan.exam_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-black text-brand-accent-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-brand-accent-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-[108px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
      <div className="h-[108px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
    </div>
  );
}

// Surfaces an in-progress mock so the candidate can resume without hunting
// through the Practice archive. SSR-guarded like the other home loaders: a
// transient Supabase failure hides the banner rather than crashing the page.
// The resume link matches Practice's exact route (/practice/mock/{id}).
async function ResumeMockLoader() {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: attempt } = await supabase
      .from("mock_attempts")
      .select("id, exam_target, test_number, updated_at")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!attempt) return null;

    return (
      <Link
        href={`/practice/mock/${attempt.id}`}
        className="group flex items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-[0.99] animate-fade-in"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 text-amber-500" aria-hidden="true">
            <Hourglass size={24} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-amber-900 truncate">
              Resume {attempt.exam_target} Mock Test {attempt.test_number}
            </h3>
            <p className="text-xs text-amber-700 font-medium">
              You have a test in progress — pick up right where you left off.
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 group-hover:bg-amber-600 text-white font-black rounded-xl transition-colors text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Resume
        </span>
      </Link>
    );
  } catch (err) {
    console.error("[ResumeMockLoader] Supabase call failed during SSR:", err);
    return null;
  }
}

// --- Main Page Component ---

export default async function HomePage() {
  // We still await user auth here to get the firstName, but this is fast.
  // Guarded so a transient auth/network failure renders the signed-out view
  // instead of crashing the whole page render.
  const supabase = createClient();
  let user = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (err) {
    console.error("[HomePage] auth.getUser failed during SSR:", err);
  }
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Pilot";

  // Guest: full-width marketing page — no wrapper div
  if (!user) {
    return <GuestLanding spotlightSlot={<TejasSpotlight />} />;
  }

  // Authenticated dashboard
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto overflow-x-hidden w-full">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between min-h-[60px] gap-6 sm:gap-4 mb-2">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Welcome Back, {firstName}
          </h1>
          <p className="text-base text-slate-700 font-medium mt-1">
            Ready to crush your next exam?
          </p>
        </div>
      </div>

      {/* ── Hub Navigation Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/planner" aria-label="Navigate to Study Planner" className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-amber-50 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]">
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><BookOpen size={22} strokeWidth={1.75} className="text-amber-600" /></span>
          <span className="text-sm font-black text-amber-900 tracking-tight">Planner</span>
        </Link>
        <Link href="/practice" aria-label="Navigate to Practice Hub" className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]">
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Target size={22} strokeWidth={1.75} className="text-emerald-600" /></span>
          <span className="text-sm font-black text-emerald-900 tracking-tight">Practice</span>
        </Link>
        <Link href="/news" aria-label="Navigate to Defense News" className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-sky-50 border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]">
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Newspaper size={22} strokeWidth={1.75} className="text-sky-600" /></span>
          <span className="text-sm font-black text-sky-900 tracking-tight">News</span>
        </Link>
        <Link href="/booklets" aria-label="Navigate to Study Booklets" className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-amber-50 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]">
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><BookMarked size={22} strokeWidth={1.75} className="text-amber-600" /></span>
          <span className="text-sm font-black text-amber-900 tracking-tight">Booklets</span>
        </Link>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col gap-8 mt-2">
        <GuestAttemptBridge />

        <Suspense fallback={null}>
          <ResumeMockLoader />
        </Suspense>

        <Suspense fallback={<div className="h-[100px] bg-gray-50 rounded-3xl animate-pulse" />}>
          <FlashcardStatusLoader />
        </Suspense>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col min-h-[220px]">
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-accent-600 mb-6">
            Recent Active Pilots
          </h2>
          <Suspense fallback={<PlanCardSkeleton />}>
            <RecentPlansLoader />
          </Suspense>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Generate Study Plan</h2>
            <p className="text-sm text-slate-700 font-medium mt-1">Powered by Gemini AI — tailored to your exact syllabus.</p>
          </div>
          <div className="flex-1">
            <Suspense fallback={<div className="h-[300px] w-full bg-gray-50 rounded-2xl animate-pulse" />}>
              <CreatePlanFormWrapper />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to fetch streak and render form so we don't block the page for it either
async function CreatePlanFormWrapper() {
  try {
    const streak = await getStreak();
    return <CreatePlanForm streak={streak} compact />;
  } catch (err) {
    console.error("[CreatePlanFormWrapper] Error during server rendering:", err);
    return <CreatePlanForm streak={0} compact />;
  }
}
