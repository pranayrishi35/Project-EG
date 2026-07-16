import { fetchMockAttempt } from "@/app/actions/mockAttempts";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
const TestRunner = dynamic(() => import("@/components/TestRunner"), { ssr: false });
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Mock Test Environment | ExamPilot",
};

export default async function MockTestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login?next=/practice");
  }

  // Derive a clean display name: prefer full_name metadata, then first part of email
  const rawName = user.user_metadata?.full_name || user.email || "Pilot";
  const candidateName = rawName.split(" ")[0].split("@")[0];

  const attemptResponse = await fetchMockAttempt(params.id);
  
  if (!attemptResponse.success || !attemptResponse.data) {
    redirect("/practice");
  }

  const attempt = attemptResponse.data;
  const isReviewMode = attempt.status === "completed";
  
  // Extract questions from answers_state
  const { questions, scoringMap, ...initialState } = attempt.answers_state || {};
  
  // If we don't have questions saved in the state (e.g. malformed data), we can't resume
  if (!questions || !scoringMap) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Test</h1>
        <p className="text-slate-500">The test payload is missing question data. Return to the dashboard and start a new test.</p>
      </div>
    );
  }

  // Restore the time_remaining from the database level if not in state, or override it
  initialState.timeRemaining = attempt.time_remaining;

  async function handleExit() {
    "use server";
    redirect("/practice");
  }

  return (
    <TestRunner 
      type={attempt.exam_target}
      questions={questions}
      scoringMap={scoringMap}
      attemptId={attempt.id}
      initialState={initialState}
      isReviewMode={isReviewMode}
      candidateName={candidateName}
      onExit={handleExit}
    />
  );
}
