import { getStreak } from "@/app/actions/getStreak";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import OnboardingTrigger from "@/components/onboarding/OnboardingTrigger";

const CreatePlanForm = dynamic(() => import("@/components/CreatePlanForm"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-50 rounded-2xl animate-pulse" />
});

export const metadata: Metadata = {
  title: "ExamPilot — AI Study Planner",
  description:
    "Upload your syllabus and get a personalised day-by-day study schedule powered by Gemini AI.",
};

// --- Isolated Data Loaders ---

async function StreakLoader() {
  const streak = await getStreak();
  
  if (streak === 0) return null;
  
  return (
    <div
      className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 shadow-sm animate-fade-in"
      aria-label={`${streak} day study streak`}
    >
      <span className="text-xl leading-none" aria-hidden="true">🔥</span>
      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-black leading-none tabular-nums"
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {streak}
        </span>
        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
          Day Streak
        </span>
      </div>
    </div>
  );
}

function StreakSkeleton() {
  return <div className="w-[120px] h-[44px] bg-gray-100 rounded-xl animate-pulse" />;
}

async function RecentPlansLoader() {
  const supabase = createClient();
  const { data: recentPlans } = await supabase
    .from("study_plans")
    .select("id, exam_name, exam_date, generated_plan")
    .order("created_at", { ascending: false })
    .limit(2);

  const plans = recentPlans || [];

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center flex-1 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
        <span className="text-4xl mb-4 opacity-50" aria-hidden="true">🛫</span>
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
            className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {plan.exam_name}
                </p>
                {/* LIGHTHOUSE FIX: WCAG Contrast Ratio */}
                <p className="text-xs text-slate-700 font-bold uppercase tracking-wider mt-1">
                  {new Date(plan.exam_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
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

// --- Main Page Component ---

export default async function HomePage() {
  // We still await user auth here to get the firstName, but this is fast.
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Pilot";

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between min-h-[60px] gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome {user ? "Back, " + firstName : "to ExamPilot"}
          </h1>
          {/* LIGHTHOUSE FIX: WCAG Contrast Ratio */}
          <p className="text-sm text-slate-700 font-medium mt-1">
            {user ? "Ready to crush your next exam?" : "Experience the future of AI-powered defense exam preparation."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!user && <OnboardingTrigger />}
          <Suspense fallback={<StreakSkeleton />}>
            <StreakLoader />
          </Suspense>
        </div>
      </div>

      {/* ── Hub Navigation Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/planner"
          aria-label="Navigate to Study Planner"
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📚</span>
          <span className="text-sm font-black text-indigo-900 tracking-tight">Planner</span>
        </Link>
        <Link
          href="/practice"
          aria-label="Navigate to Practice Hub"
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">🎯</span>
          <span className="text-sm font-black text-emerald-900 tracking-tight">Practice</span>
        </Link>
        <Link
          href="/news"
          aria-label="Navigate to Defense News"
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-sky-50 border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📰</span>
          <span className="text-sm font-black text-sky-900 tracking-tight">News</span>
        </Link>
        <Link
          href="/booklets"
          aria-label="Navigate to Study Booklets"
          className="group flex flex-col items-center text-center gap-2 p-5 rounded-3xl bg-amber-50 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">📖</span>
          <span className="text-sm font-black text-amber-900 tracking-tight">Booklets</span>
        </Link>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col gap-8 mt-2">
        
        {/* Top Section: Recent Active Pilots */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col min-h-[220px]">
          <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-6">
            Recent Active Pilots
          </h2>
          <Suspense fallback={<PlanCardSkeleton />}>
            <RecentPlansLoader />
          </Suspense>
        </div>

        {/* Bottom Section: Core Engine (Create Form) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Generate Study Plan</h2>
            {/* LIGHTHOUSE FIX: WCAG Contrast Ratio */}
            <p className="text-sm text-slate-700 font-medium mt-1">Powered by Gemini AI — tailored to your exact syllabus.</p>
          </div>
          <div className="flex-1">
            {/* The streak prop is still needed by CreatePlanForm, wait! */}
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
  const streak = await getStreak();
  return <CreatePlanForm streak={streak} compact />;
}
