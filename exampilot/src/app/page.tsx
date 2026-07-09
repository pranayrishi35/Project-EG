import { getStreak } from "@/app/actions/getStreak";
import CreatePlanForm from "@/components/CreatePlanForm";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ExamPilot — AI Study Planner",
  description:
    "Upload your syllabus and get a personalised day-by-day study schedule powered by Gemini AI.",
};

export default async function HomePage() {
  const streak = await getStreak();
  const supabase = createClient();
  
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Pilot";

  // Fetch recent plans
  const { data: recentPlans } = await supabase
    .from("study_plans")
    .select("id, exam_name, exam_date, generated_plan")
    .order("created_at", { ascending: false })
    .limit(2);

  const plans = recentPlans || [];

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome Back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Ready to crush your next exam?
          </p>
        </div>
        {streak > 0 && (
          <div
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 shadow-sm"
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
        )}
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Core Engine (Create Form) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col h-full">
          <div className="mb-5">
            <h2 className="text-lg font-black text-gray-800">Create Study Plan</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Powered by Gemini AI</p>
          </div>
          <div className="flex-1">
            <CreatePlanForm streak={streak} compact />
          </div>
        </div>

        {/* Right Column: Quick Actions & Recent */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/planner"
              className="group flex flex-col gap-2 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/50 transition-all active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">📚</span>
              <span className="text-sm font-bold text-indigo-900">My Planner</span>
            </Link>
            
            <Link
              href={plans.length > 0 ? `/planner/${plans[0].id}?tab=mocks` : "/planner"}
              className="group flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/50 transition-all active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">🎯</span>
              <span className="text-sm font-bold text-emerald-900 leading-tight">Mock Test Analytics</span>
            </Link>

            <div
              className="relative overflow-hidden flex flex-col gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-200 opacity-80"
            >
              <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md">Coming Soon</span>
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm grayscale opacity-50">⚡</span>
              <span className="text-sm font-bold text-gray-700">Daily Flashcards</span>
            </div>

            <Link
              href="/settings"
              className="group flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">⚙️</span>
              <span className="text-sm font-bold text-slate-700">Settings</span>
            </Link>
          </div>

          {/* Recent Active Pilots */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 flex-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-4">
              Recent Active Pilots
            </h2>
            
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-3xl mb-2 opacity-50" aria-hidden="true">🛫</span>
                <p className="text-sm font-bold text-gray-500">No active plans</p>
                <p className="text-xs text-gray-400 mt-1">Generate a plan to see it here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {plans.map((plan) => {
                  const weeks = plan.generated_plan?.weeks || [];
                  const totalTopics = weeks.reduce((acc: number, w: { days: { topics: unknown[] }[] }) => acc + w.days.reduce((a: number, d: { topics: unknown[] }) => a + d.topics.length, 0), 0);
                  const completed = plan.generated_plan?.completed_topics?.length || 0;
                  const progress = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

                  return (
                    <Link
                      key={plan.id}
                      href={`/planner/${plan.id}`}
                      className="group flex flex-col gap-2 p-3 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {plan.exam_name}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                            {new Date(plan.exam_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
