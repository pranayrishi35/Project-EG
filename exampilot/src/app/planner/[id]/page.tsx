import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import PlanViewer from "@/components/PlanViewer";
import type { ExtendedPlan } from "@/app/actions/toggleTopic";
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

  return (
    <PlanViewer
      planId={data.id}
      examName={data.exam_name}
      examDate={data.exam_date}
      plan={data.generated_plan as ExtendedPlan}
    />
  );
}
