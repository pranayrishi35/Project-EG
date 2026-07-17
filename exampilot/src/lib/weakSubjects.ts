import { createClient } from "@/utils/supabase/server";

export async function getWeakestSubjects(examTarget: string, limit: number = 2): Promise<string[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch the last 5 completed mocks for this exam
  const { data: attempts, error } = await supabase
    .from("mock_attempts")
    .select("subject_stats")
    .eq("user_id", user.id)
    .eq("exam_target", examTarget)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !attempts || attempts.length === 0) {
    return []; // No data, fallback to general
  }

  // Aggregate stats
  const aggregated: Record<string, { correct: number; total: number }> = {};

  for (const attempt of attempts) {
    const stats = attempt.subject_stats as Record<string, { correct: number; total: number }> | null;
    if (!stats) continue;

    for (const [subject, data] of Object.entries(stats)) {
      if (!aggregated[subject]) {
        aggregated[subject] = { correct: 0, total: 0 };
      }
      aggregated[subject].correct += data.correct;
      aggregated[subject].total += data.total;
    }
  }

  // Calculate percentages and sort
  const subjectPercentages = Object.entries(aggregated)
    .map(([subject, data]) => {
      return {
        subject,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 100 // Ignore if 0 attempted
      };
    })
    .filter(s => s.accuracy < 100) // Ignore perfect or unattempted subjects
    .sort((a, b) => a.accuracy - b.accuracy);

  return subjectPercentages.slice(0, limit).map(s => s.subject);
}
