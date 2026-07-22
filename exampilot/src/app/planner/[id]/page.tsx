import { createClient } from "@/utils/supabase/server";
import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
const PlanViewer = dynamic(() => import("@/components/PlanViewer"), { ssr: false });
import type { ExtendedPlan } from "@/app/actions/toggleTopic";
import { getWeakestSubjects } from "@/lib/weakSubjects";
import type { Metadata } from "next";

// ─── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Study Plan — ExamPilot",
  description: "Your AI-generated day-by-day study schedule.",
};

// ─── Page (Server Component — fetches data, then delegates to client) ──────────

export default async function PlanViewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Auth check — RLS also protects the query below
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/planner/${params.id}`);
  }

  // Fetch the plan row
  const { data, error } = await supabase
    .from("study_plans")
    .select("id, exam_name, exam_date, generated_plan")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  // Weak-subject intelligence, computed server-side from the user's last 5
  // completed mocks for this exam. Surfaced in the planner so the "Target Weak
  // Subjects" focus toggle is transparent — the candidate can see WHICH subjects
  // the adaptive engine will prioritise, not just that focus mode is on. Guarded
  // so a stats failure never blocks the plan from rendering.
  let weakSubjects: string[] = [];
  try {
    weakSubjects = await getWeakestSubjects(data.exam_name);
  } catch (err) {
    console.error("[PlanViewPage] getWeakestSubjects failed:", err);
  }

  return (
    <PlanViewer
      planId={data.id}
      examName={data.exam_name}
      examDate={data.exam_date}
      plan={data.generated_plan as ExtendedPlan}
      weakSubjects={weakSubjects}
    />
  );
}
