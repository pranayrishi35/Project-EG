"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { z } from "zod";
import { EXAM_CONFIGS } from "@/lib/examConfig";

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
    incorrect: z.number()
  }).optional(),
  testNumber: z.number().optional()
});

export async function saveMockProgress(payload: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Explicit Authorization Verification
  if (payload.user_id && payload.user_id !== user.id) {
    return { success: false, error: "Unauthorized: payload user_id mismatch" };
  }
  
  if (payload.id) {
    // Verify attempt ownership if it exists
    const { data: existingAuth } = await supabase.from('mock_attempts').select('user_id').eq('id', payload.id).single();
    if (existingAuth && existingAuth.user_id !== user.id) {
      return { success: false, error: "Unauthorized: You do not own this mock attempt." };
    }
  }

  const { id, exam_target, test_number, status, score, time_remaining, answers_state: rawAnswersState } = payload;
  
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
  
  let currentTestNumber = test_number;

  // Phase 1: Calculate test_number if missing
  if (currentTestNumber === undefined || currentTestNumber === null) {
    // Check if attempt already exists to prevent overwriting test_number
    const { data: existing } = await supabase
      .from('mock_attempts')
      .select('test_number')
      .eq('id', id)
      .single();

    if (existing && existing.test_number) {
      currentTestNumber = existing.test_number;
    } else {
      const { count, error: countError } = await supabase
        .from('mock_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('exam_target', exam_target);
        
      if (countError) {
        console.error("[Mock Sync Count Error]", countError);
      }
      currentTestNumber = (count || 0) + 1;
    }
  }
  let finalScore = score;

  let subjectStats: Record<string, { correct: number; total: number }> = {};

  // Phase 2: Server-Side Score Recalculation (Security Audit Fix)
  if (status === 'completed' && answers_state?.questions) {
    const config = EXAM_CONFIGS[exam_target as keyof typeof EXAM_CONFIGS] || EXAM_CONFIGS["AFCAT"]!;
    const mpc = config.marks_per_correct;
    const pip = config.negative_marking;

    // 1. Pre-fill the stats object with the guaranteed totals
    for (const [subject, total] of Object.entries(config.subject_breakdown)) {
      subjectStats[subject] = { correct: 0, total };
    }

    const qIds = answers_state.questions.map((q: any) => q.id);
    
    // Fetch truth from database using service role (bypassing column restrictions)
    const adminSupabase = getAdminClient();
    const { data: truthData } = await adminSupabase
      .from('question_bank')
      .select('id, correct_index')
      .in('id', qIds);

    if (truthData) {
      const truthMap = new Map(truthData.map((t: any) => [t.id, t.correct_index]));
      
      let correctCount = 0;
      let incorrectCount = 0;

      answers_state.questions.forEach((q: any) => {
        const subject = q.subject || "General Awareness"; // Fallback
        const qStatus = answers_state.statuses[q.id] || "unvisited";
        const isConsidered = qStatus === "answered" || qStatus === "answered_and_marked";
        
        if (isConsidered) {
          const selected = answers_state.selectedAnswers[q.id];
          const realCorrectIndex = truthMap.get(q.id);
          
          if (realCorrectIndex !== undefined && selected === realCorrectIndex) {
            correctCount++;
            if (subjectStats[subject]) {
              subjectStats[subject].correct++;
            }
          } else {
            incorrectCount++;
          }
        }
        
        // Inject correctIndex back into the question payload for Review Mode
        q.correctIndex = truthMap.get(q.id);
      });
      
      finalScore = (correctCount * mpc) + (incorrectCount * pip);
    }
  }
        const payloadToSave = {
          id,
          user_id: user.id,
          exam_target,
          test_number: currentTestNumber,
          status,
          score: finalScore,
          time_remaining,
          answers_state,
          subject_stats: subjectStats, // new field
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('mock_attempts').upsert(payloadToSave, { onConflict: 'id' }).select().single();

  if (error) {
    console.error("[Mock Sync Error]", error);
    return { success: false, error: error.message, code: error.code };
  }
  return { success: true, data };
}

export async function fetchMockHistory() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
