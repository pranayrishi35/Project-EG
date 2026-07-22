"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { z } from "zod";
import { EXAM_CONFIGS } from "@/lib/examConfig";
import { isGuestUser } from "@/lib/guestShield";
import { MOCK_HISTORY_DATA, MOCK_PERFORMANCE_DASHBOARD_DATA } from "@/lib/mockData";

const QStatusSchema = z.enum(["unvisited", "unanswered", "answered", "marked", "answered_and_marked"]);

const QuestionSchema = z.object({
  id: z.string().max(200),
  text: z.string().optional(),
  options: z.array(z.string()).optional(),
  imageUrl: z.string().nullable().optional(),
  subject: z.string().optional(),
  correctIndex: z.number().optional(),
  pyqYear: z.number().nullable().optional(),
});

const AnswerStateSchema = z.object({
  currentQuestionIndex: z.number().optional(),
  selectedAnswers: z.record(z.string(), z.number()).optional(),
  statuses: z.record(z.string(), QStatusSchema).optional(),
  questions: z.array(QuestionSchema).optional(),
  scoringMap: z.object({
    correct: z.number(),
    incorrect: z.number(),
    // Preserve the authoritative test duration through sync/resume. Without
    // this key Zod would strip it, and a resumed attempt would fall back to
    // the legacy 120-min default instead of the real per-exam length.
    durationSeconds: z.number().optional()
  }).optional(),
  testNumber: z.number().optional()
});

type ExistingAttemptRow = {
  user_id: string;
  status: string | null;
  exam_target: string | null;
  test_number: number | null;
  served_question_ids: string[] | null;
};

export async function saveMockProgress(payload: any) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Not authenticated" };

  // Explicit Authorization Verification
  if (payload.user_id && payload.user_id !== user.id) {
    return { success: false, error: "Unauthorized: payload user_id mismatch" };
  }
  
  // Ownership + immutability: read the current row once so we can (a) reject
  // writes to another user's attempt and (b) treat a 'completed' attempt as
  // append-only. Without the immutability guard, the submit-once / read-key /
  // resubmit-all-correct exploit lets a user overwrite a graded row with a
  // perfect score.
  let existingStatus: string | null = null;
  let existingRow: ExistingAttemptRow | null = null;
  if (payload.id) {
    const { data: existingAuth } = await supabase
      .from('mock_attempts')
      .select('user_id, status, exam_target, test_number, served_question_ids')
      .eq('id', payload.id)
      .single();
    const row = existingAuth as ExistingAttemptRow | null;
    if (row && row.user_id !== user.id) {
      return { success: false, error: "Unauthorized: You do not own this mock attempt." };
    }
    existingRow = row;
    existingStatus = row?.status ?? null;
  }

  // A completed attempt is final. Reject any further write to it — this closes
  // the resubmit-with-answer-key forgery and prevents score tampering.
  if (existingStatus === 'completed') {
    return { success: false, error: "This attempt is already submitted and cannot be modified." };
  }

  const { id, exam_target: clientExamTarget, test_number, status, score, time_remaining, answers_state: rawAnswersState } = payload;

  // Zod Validation to strip unexpected payload fields
  let answers_state = rawAnswersState;
  if (rawAnswersState) {
    const parseResult = AnswerStateSchema.safeParse(rawAnswersState);
    if (!parseResult.success) {
      console.error("[Mock Sync] Invalid answers_state structure:", parseResult.error);
      return { success: false, error: "Invalid payload structure" };
    }
    answers_state = parseResult.data;
  }

  // Authoritative exam_target: once getMockTest has created the row it owns the
  // real target ("AFCAT"/"CDS"/…). The client sends its UI `type` ("Full Mock")
  // as exam_target, so for an existing row we must NOT let that overwrite the
  // stored value — grading config, cohort key, and leaderboard partitioning all
  // key off it. Fall back to the client value only for legacy client-seeded rows.
  const authoritativeExamTarget = existingRow?.exam_target ?? clientExamTarget;

  let currentTestNumber = existingRow?.test_number ?? test_number;

  // Phase 1: Calculate test_number if missing (only for fresh, non-server-seeded rows)
  if (currentTestNumber === undefined || currentTestNumber === null) {
    const { count, error: countError } = await supabase
      .from('mock_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('exam_target', authoritativeExamTarget);

    if (countError) {
      console.error("[Mock Sync Count Error]", countError);
    }
    currentTestNumber = (count || 0) + 1;
  }
  // The client-supplied score is NEVER trusted for a completed attempt. For a
  // completed submission the server recomputes the score from the answer key
  // below; the client value is only retained for in-progress saves (where it
  // is not ranked). Defaulting to undefined guarantees a completed attempt that
  // fails recompute is rejected rather than silently ranked on a forged score.
  let finalScore = status === 'completed' ? undefined : score;

  let subjectStats: Record<string, { correct: number; total: number }> = {};

  // A completed attempt MUST carry its questions so the server can grade it.
  // Omitting the array used to bypass recompute and let the client score win.
  if (status === 'completed' && !answers_state?.questions) {
    return { success: false, error: "A completed attempt must include its question set for grading." };
  }

  // Phase 2: Server-Side Score Recalculation (Security Audit Fix)
  if (status === 'completed' && answers_state?.questions) {
    // Grade with the exact config for this exam target. Never silently fall back
    // to AFCAT's +3/-1 for an unknown target — that would mis-grade (e.g.) an NDA
    // attempt on the wrong marking scheme and corrupt the score/leaderboard.
    // Fail loudly instead so the bad attempt is surfaced, not ranked on bad math.
    const config = EXAM_CONFIGS[authoritativeExamTarget as keyof typeof EXAM_CONFIGS];
    if (!config) {
      console.error("[Mock Sync] Unknown exam_target for grading:", authoritativeExamTarget);
      return { success: false, error: `Cannot grade attempt: unknown exam target "${authoritativeExamTarget}".` };
    }
    const mpc = config.marks_per_correct;
    const pip = config.negative_marking;

    // 1. Pre-fill the stats object with the guaranteed totals
    for (const [subject, total] of Object.entries(config.subject_breakdown)) {
      subjectStats[subject] = { correct: 0, total };
    }

    // Server-authoritative question set: if getMockTest recorded which ids were
    // served for this attempt, grading is confined to exactly that set. A client
    // that appends extra (correctly-answered) questions, swaps ids, or drops the
    // ones it got wrong cannot change its score — only served ids count, and any
    // served id the client omits is treated as unanswered.
    const servedIds: string[] | null =
      Array.isArray(existingRow?.served_question_ids) && existingRow!.served_question_ids!.length > 0
        ? existingRow!.served_question_ids!
        : null;

    const gradableIds = servedIds ?? answers_state.questions.map((q: any) => q.id);
    const gradableIdSet = new Set(gradableIds);

    // Fetch truth from database using service role (bypassing column restrictions)
    const adminSupabase = getAdminClient();
    const { data: truthData } = await adminSupabase
      .from('question_bank')
      .select('id, subject, correct_index')
      .in('id', gradableIds);

    if (truthData) {
      const truthMap = new Map(truthData.map((t: any) => [t.id, t.correct_index]));
      // Prefer the DB subject over the client-supplied one for stats integrity.
      const subjectMap = new Map(truthData.map((t: any) => [t.id, t.subject]));

      let correctCount = 0;
      let incorrectCount = 0;

      // statuses/selectedAnswers are optional in the schema; default to empty
      // maps so a completed payload that omits them cannot crash the action.
      const statuses = answers_state.statuses ?? {};
      const selectedAnswers = answers_state.selectedAnswers ?? {};

      // Grade over the authoritative id set, not the client's question array.
      for (const qId of gradableIds) {
        const subject = subjectMap.get(qId) || "General Awareness";
        const qStatus = statuses[qId] || "unvisited";
        const isConsidered = qStatus === "answered" || qStatus === "answered_and_marked";

        if (isConsidered) {
          const selected = selectedAnswers[qId];
          const realCorrectIndex = truthMap.get(qId);

          if (realCorrectIndex !== undefined && selected === realCorrectIndex) {
            correctCount++;
            if (subjectStats[subject]) {
              subjectStats[subject].correct++;
            }
          } else {
            incorrectCount++;
          }
        }
      }

      // Inject correctIndex back into the payload for Review Mode. Only questions
      // in the authoritative set receive a key; anything the client added stays
      // ungraded (undefined) so review can't be spoofed either.
      answers_state.questions.forEach((q: any) => {
        if (gradableIdSet.has(q.id)) {
          q.correctIndex = truthMap.get(q.id);
        }
      });

      finalScore = (correctCount * mpc) + (incorrectCount * pip);
    }
  }

  let cohort_key = 'GLOBAL';
  if (status === 'completed') {
    const { data: planData } = await supabase
      .from('study_plans')
      .select('exam_date')
      .eq('user_id', user.id)
      .eq('exam_name', authoritativeExamTarget)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planData?.exam_date) {
      const date = new Date(planData.exam_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      cohort_key = `${authoritativeExamTarget}_${year}_${month}`;
    }
  }

        const payloadToSave = {
          id,
          user_id: user.id,
          exam_target: authoritativeExamTarget,
          test_number: currentTestNumber,
          status,
          score: finalScore,
          time_remaining,
          answers_state,
          subject_stats: subjectStats, // new field
          cohort_key, // Phase 8: cohort dimension
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('mock_attempts').upsert(payloadToSave, { onConflict: 'id' }).select().single();

  if (error) {
    console.error("[Mock Sync Error]", error);
    return { success: false, error: error.message, code: error.code };
  }

  // Refresh the leaderboard materialized view so the just-submitted score is
  // ranked immediately. get_instant_rank reads mock_leaderboards, which is a
  // snapshot — without this refresh a fresh attempt never appears in its own
  // rank/percentile. Runs via the service role (the MV is not exposed to the
  // client role) and is best-effort: a refresh failure must not fail the save.
  if (status === 'completed') {
    try {
      const adminSupabase = getAdminClient();
      const { error: refreshError } = await adminSupabase.rpc('refresh_mock_leaderboards');
      if (refreshError) {
        console.error("[Mock Sync] Leaderboard refresh failed:", refreshError);
      }
    } catch (refreshErr) {
      console.error("[Mock Sync] Leaderboard refresh threw:", refreshErr);
    }
  }

  return { success: true, data };
}

export async function fetchMockHistory() {
  if (isGuestUser()) {
    return { success: true, data: MOCK_HISTORY_DATA };
  }
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase.from('mock_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function fetchMockAttempt(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('mock_attempts').select('*').eq('id', id).single();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function fetchAggregateStats(target?: string) {
  if (isGuestUser()) {
    return {
      success: true,
      stats: {
        totalAttempts: MOCK_PERFORMANCE_DASHBOARD_DATA.tests_taken,
        bestScore: MOCK_PERFORMANCE_DASHBOARD_DATA.average_score,
        avgAccuracy: 85,
        trendData: [{
          id: MOCK_HISTORY_DATA[0].id,
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          accuracy: 85,
          score: MOCK_PERFORMANCE_DASHBOARD_DATA.average_score,
          exam_target: "AFCAT"
        }]
      }
    };
  }
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Not authenticated" };

  let query = supabase.from('mock_attempts')
    .select('id, score, exam_target, created_at, subject_stats')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: true }); // chronological for trendline

  if (target) {
    query = query.eq('exam_target', target);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: true, stats: null };
  }

  let totalAccuracy = 0;
  let bestScore = -Infinity;
  let validTestsCount = 0;

  const trendData = data.map((attempt) => {
    let testAccuracy = 0;
    let totalQuestions = 0;
    
    if (attempt.subject_stats) {
      let totalCorrect = 0;
      Object.values(attempt.subject_stats).forEach((stat: any) => {
         totalCorrect += stat.correct || 0;
         totalQuestions += stat.total || 0;
      });
      testAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    }

    if (totalQuestions > 0) {
      totalAccuracy += testAccuracy;
      validTestsCount++;
    }

    if (attempt.score !== null && attempt.score > bestScore) {
      bestScore = attempt.score;
    }

    return {
      id: attempt.id,
      date: new Date(attempt.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      accuracy: Math.round(testAccuracy),
      score: attempt.score,
      exam_target: attempt.exam_target
    };
  });

  const avgAccuracy = validTestsCount > 0 ? Math.round(totalAccuracy / validTestsCount) : 0;
  // Slice to last 15 tests so chart doesn't overflow horizontally infinitely
  const recentTrend = trendData.slice(-15);

  return { 
    success: true, 
    stats: {
      totalAttempts: data.length,
      bestScore: bestScore === -Infinity ? 0 : bestScore,
      avgAccuracy,
      trendData: recentTrend
    }
  };
}
