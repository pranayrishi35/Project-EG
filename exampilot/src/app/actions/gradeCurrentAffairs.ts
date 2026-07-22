"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { z } from "zod";
import type { Question } from "@/app/actions/getMockTest";

// Daily Current Affairs scoring (product choice, not an official exam pattern):
// +1 correct / -0.33 incorrect. Kept in sync with getCurrentAffairsTest.ts.
const CA_MARKS_CORRECT = 1;
const CA_MARKS_INCORRECT = -0.33;

const GradeCurrentAffairsSchema = z.object({
  // Ids the client claims it was served. Grading is confined to the intersection
  // of these ids and what the DB actually returns, so a fabricated id simply
  // finds no answer key and cannot inflate the score.
  questionIds: z.array(z.string().max(200)).min(1).max(100),
  selectedAnswers: z.record(z.string(), z.number()),
  statuses: z.record(
    z.string(),
    z.enum(["unvisited", "unanswered", "answered", "marked", "answered_and_marked"])
  ),
});

export interface GradeResult {
  success: true;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  // The served questions with the authoritative correctIndex injected, so the
  // client debrief/review can render right/wrong answers. The client never had
  // correct_index (it is REVOKE'd from the authenticated role), which is why the
  // Current Affairs quiz previously scored every answer as wrong.
  gradedQuestions: Question[];
}

export type GradeResponse = GradeResult | { success: false; error: string };

/**
 * Server-authoritative grading for the Daily Current Affairs quiz.
 *
 * Unlike full mocks, a Current Affairs drill does NOT create a mock_attempts row
 * (no test_number, no leaderboard cohort) — it is daily practice, not a ranked
 * mock, and "Current Affairs" is not a target in EXAM_CONFIGS. This action only
 * grades and returns the result; it writes nothing.
 *
 * The answer key (question_bank.correct_index) is column-REVOKE'd from the
 * authenticated/anon roles, so grading must run through the service-role admin
 * client here — the client genuinely cannot read the key.
 */
export async function gradeCurrentAffairs(raw: unknown): Promise<GradeResponse> {
  const parsed = GradeCurrentAffairsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid grading payload." };
  }
  const { questionIds, selectedAnswers, statuses } = parsed.data;

  // The /practice route is auth-gated by middleware, but re-check here so this
  // action can never act as an anonymous answer-key oracle.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to submit this quiz." };
  }

  // The answer key (question_bank.correct_index) is meant to be column-REVOKE'd
  // from the authenticated/anon roles (see rls_policies.sql), so grading must run
  // through the service-role admin client here rather than trust a client-supplied
  // key. (NOTE: that REVOKE must actually be applied in the target database for
  // the guarantee to hold — see the pending-migrations note.)
  const admin = getAdminClient();
  const { data: truth, error } = await admin
    .from("question_bank")
    .select("id, question, options, subject, is_pyq, pyq_year, correct_index")
    .in("id", questionIds);

  if (error) {
    console.error("[gradeCurrentAffairs] answer key fetch failed:", error);
    return { success: false, error: "Could not grade the quiz. Please try again." };
  }

  const rows = truth || [];
  let correctCount = 0;
  let incorrectCount = 0;

  interface TruthRow {
    id: string;
    question: string;
    options: string[];
    subject: string | null;
    is_pyq: boolean;
    pyq_year: number | null;
    correct_index: number;
  }

  const gradedQuestions: Question[] = rows.map((row: TruthRow) => {
    const status = statuses[row.id] || "unvisited";
    const isConsidered = status === "answered" || status === "answered_and_marked";
    if (isConsidered) {
      const selected = selectedAnswers[row.id];
      if (selected !== undefined && selected === row.correct_index) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
    return {
      id: row.id,
      text: row.question,
      options: row.options,
      subject: row.subject || "Current Affairs",
      isPyq: row.is_pyq,
      pyqYear: row.pyq_year ?? undefined,
      correctIndex: row.correct_index,
    };
  });

  const score = (correctCount * CA_MARKS_CORRECT) + (incorrectCount * CA_MARKS_INCORRECT);
  const maxScore = rows.length * CA_MARKS_CORRECT;

  return {
    success: true,
    score,
    maxScore,
    correctCount,
    incorrectCount,
    gradedQuestions,
  };
}
