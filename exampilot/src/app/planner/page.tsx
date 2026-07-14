import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { ExtendedPlan } from "@/app/actions/toggleTopic";
import DeletePlanButton from "@/components/DeletePlanButton";

export const metadata: Metadata = {
  title: "My Plans — ExamPilot",
  description: "View and manage all your AI-generated study plans.",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PlanSummary {
  id: string;
  exam_name: string;
  exam_date: string;
  created_at: string;
  generated_plan: ExtendedPlan;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countAllTopics(plan: ExtendedPlan): number {
  return plan.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.topics.length, 0),
    0
  );
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-6">

      {/* Icon disc */}
      <div
        className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-lg"
        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)" }}
        aria-hidden="true"
      >
        {/* Calendar SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="url(#calendarGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="calendarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </svg>
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">
          Your airspace is clear.
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-[280px] mx-auto">
          No study plans yet. Upload your syllabus and ExamPilot will chart the
          perfect flight path to exam success.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/"
        id="launch-first-pilot-btn"
        className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg animate-pulse hover:animate-none"
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          boxShadow: "0 4px 24px rgba(79, 70, 229, 0.35)",
        }}
      >
        {/* Plus icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Create Your First Mission
      </Link>

      {/* Trust signal */}
      <p className="text-xs text-gray-300 -mt-2">
        AI-powered · Ready in ~15 seconds · Free
      </p>
    </div>
  );
}


// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: PlanSummary }) {
  const total = countAllTopics(plan.generated_plan);
  const completed = plan.generated_plan.completed_topics?.length ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const daysLeft = daysUntil(plan.exam_date);

  const examDateLabel = new Date(plan.exam_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    // Outer wrapper: relative so the delete button can be absolutely positioned
    <div className="relative group">
      <Link
        href={`/planner/${plan.id}`}
        className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:border-indigo-100 active:scale-[0.99]"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pr-12">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {plan.exam_name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{examDateLabel}</span>
            </div>
          </div>

          {/* Days-left badge */}
          <div
            className={[
              "flex-shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold",
              daysLeft > 14
                ? "bg-emerald-50 text-emerald-700"
                : daysLeft > 7
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            {daysLeft > 0 ? `${daysLeft}d left` : "Exam day!"}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{completed} / {total} topics done</span>
            <span className={["font-bold", progress === 100 ? "text-emerald-600" : progress > 50 ? "text-indigo-600" : "text-gray-500"].join(" ")}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${progress}% complete`}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, #4F46E5, #7C3AED)" }} />
          </div>
        </div>
      </Link>

      {/* Delete button — absolutely positioned top-right, outside the Link */}
      <div className="absolute top-2 right-2 z-10">
        <DeletePlanButton planId={plan.id} planName={plan.exam_name} />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PlannerPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/planner");
  }

  const { data: plans, error } = await supabase
    .from("study_plans")
    .select("id, exam_name, exam_date, created_at, generated_plan")
    .order("created_at", { ascending: false });

  const hasPlanss = !error && plans && plans.length > 0;

  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">
            My Plans
          </p>
          <h1 className="text-xl font-bold text-gray-900">Study Planner</h1>
        </div>
        <Link
          href="/"
          id="new-plan-btn"
          className="flex items-center gap-2 rounded-2xl px-5 py-3 min-h-[48px] text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-95 shadow-md hover:shadow-lg"
          style={{ 
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)"
          }}
          aria-label="Create a new mission plan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="hidden sm:inline">Create New Mission</span>
          <span className="sm:hidden">New Mission</span>
        </Link>
      </div>

      {/* Content */}
      {hasPlanss ? (
        <div className="flex flex-col gap-3">
          {(plans as PlanSummary[]).map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
