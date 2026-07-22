"use server";
import { z } from "zod";
import { getWeakestSubjects } from "@/lib/weakSubjects";

import { createClient } from "@/utils/supabase/server";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
  subject: string;
  isPyq: boolean;
  pyqYear?: number;
  imageUrl?: string;
}

export interface ScoringMap {
  correct: number;
  incorrect: number;
  // Authoritative test duration in seconds, derived from EXAM_CONFIGS per exam
  // target (mini drills use a fixed 15-minute product window). Plumbed through
  // so the CBT timer reflects the real exam length — e.g. NDA is 150 min, not
  // the old hardcoded 120. Optional for backward-compatible persisted attempts.
  durationSeconds?: number;
}

export type GetTestResult =
  | { success: true; questions: Question[]; scoringMap: ScoringMap; focusedSubjects?: string[]; attemptId?: string; testNumber?: number }
  | { success: false; error: string; shortage?: boolean };

import { EXAM_CONFIGS } from "@/lib/examConfig"; // centralized config

const GetMockTestSchema = z.object({ examTarget: z.string(), mini: z.boolean().default(false), focusMode: z.boolean().default(false) });
export async function getMockTest(rawExamTarget: string, rawMini: boolean = false, rawFocusMode: boolean = false): Promise<GetTestResult> {
  const parsed = GetMockTestSchema.safeParse({ examTarget: rawExamTarget, mini: rawMini, focusMode: rawFocusMode });
  if (!parsed.success) throw new Error("BAD_REQUEST");
  const { examTarget, mini, focusMode } = parsed.data;
  const supabase = createClient();
  const config = EXAM_CONFIGS[examTarget as keyof typeof EXAM_CONFIGS];
  
  if (!config) {
    return { success: false, error: `Unsupported exam target "${examTarget}". Supported: ${Object.keys(EXAM_CONFIGS).join(", ")}.` };
  }

  const totalQuestions = mini ? 15 : config.total_questions;
  const pyqTarget = Math.floor(totalQuestions * 0.25); // Target ~25% PYQs

  try {
    // 1. Determine Focus Mode Targets
    let focusedSubjects: string[] = [];
    if (mini && focusMode) {
      focusedSubjects = await getWeakestSubjects(examTarget);
    }

    // 2. Fetch PYQs
    let pyqQuery = supabase
      .from("question_bank")
      .select("id, question, options, subject, is_pyq, pyq_year")
      .eq("exam_target", examTarget)
      .eq("source_pool", "mock")
      .eq("is_pyq", true)
      .eq("review_status", "approved")
      .neq("subject", "Current Affairs");

    if (focusedSubjects.length > 0) {
      // 60% of PYQs focused on weak subjects
      const weakPyqTarget = Math.ceil(pyqTarget * 0.6);
      const { data: weakPyqs } = await supabase
        .from("question_bank")
        .select("id, question, options, subject, is_pyq, pyq_year")
        .eq("exam_target", examTarget)
        .eq("source_pool", "mock")
        .eq("is_pyq", true)
        .eq("review_status", "approved")
        .in("subject", focusedSubjects)
        .limit(weakPyqTarget);
      
      const fetchedWeakPyqs = weakPyqs || [];
      const remainingPyqTarget = pyqTarget - fetchedWeakPyqs.length;
      
      if (remainingPyqTarget > 0) {
        pyqQuery = pyqQuery.limit(remainingPyqTarget);
      }
      
      const { data: pyqData, error: pyqError } = await pyqQuery;
      if (pyqError) throw pyqError;
      
      var fetchedPyqs = [...fetchedWeakPyqs, ...(pyqData || [])];
    } else {
      pyqQuery = pyqQuery.limit(pyqTarget);
      const { data: pyqData, error: pyqError } = await pyqQuery;
      if (pyqError) throw pyqError;
      var fetchedPyqs = pyqData || [];
    }

    // 3. Fetch standard questions
    const standardLimit = totalQuestions - fetchedPyqs.length;
    let stdQuery = supabase
      .from("question_bank")
      .select("id, question, options, subject, is_pyq, pyq_year")
      .eq("exam_target", examTarget)
      .eq("source_pool", "mock")
      .eq("is_pyq", false)
      .eq("review_status", "approved")
      .neq("subject", "Current Affairs");

    if (focusedSubjects.length > 0) {
      // 60% of Standard focused on weak subjects
      const weakStdTarget = Math.ceil(standardLimit * 0.6);
      const { data: weakStd } = await supabase
        .from("question_bank")
        .select("id, question, options, subject, is_pyq, pyq_year")
        .eq("exam_target", examTarget)
        .eq("source_pool", "mock")
        .eq("is_pyq", false)
        .eq("review_status", "approved")
        .in("subject", focusedSubjects)
        .limit(weakStdTarget);
        
      const fetchedWeakStd = weakStd || [];
      const remainingStdTarget = standardLimit - fetchedWeakStd.length;
      
      if (remainingStdTarget > 0) {
        stdQuery = stdQuery.limit(remainingStdTarget);
      }
      
      const { data: stdData, error: stdError } = await stdQuery;
      if (stdError) throw stdError;
      
      var fetchedStandard = [...fetchedWeakStd, ...(stdData || [])];
    } else {
      stdQuery = stdQuery.limit(standardLimit);
      const { data: stdData, error: stdError } = await stdQuery;
      if (stdError) throw stdError;
      var fetchedStandard = stdData || [];
    }
    
    // Combine results
    const combined = [...fetchedPyqs, ...fetchedStandard];
    
    if (combined.length === 0) {
      return { 
        success: false, 
        error: `Not enough questions in the Question Bank for this Mock Test. Please ask your administrator to generate a Full Mock for ${examTarget} in the Command Center.`, 
        shortage: true 
      };
    }
    
    // Shuffle logic (Fisher-Yates) ensures randomized test experience
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    const mappedQuestions: Question[] = combined.map(q => ({
      id: q.id,
      text: q.question,
      options: q.options,
      subject: q.subject || "General",
      isPyq: q.is_pyq,
      pyqYear: q.pyq_year
    }));

    // Server-authoritative attempt: the SERVER decides which question ids make up
    // this attempt and records them (served_question_ids). Grading on submit is
    // restricted to exactly this set, so a client cannot enlarge, swap, or inject
    // questions to inflate its score. The server also owns the attempt id and the
    // exam_target — the client can no longer forge either.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "You must be signed in to start a mock test." };
    }

    // Compute the next test_number for this (user, exam_target) up front so the
    // row is complete and ranked deterministically from creation.
    const { count } = await supabase
      .from("mock_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("exam_target", examTarget);

    const servedIds = mappedQuestions.map(q => q.id);
    const scoringMap = {
      correct: config.marks_per_correct,
      incorrect: config.negative_marking,
      // Mini drills are a fixed 15-minute product window regardless of exam;
      // full mocks use the official per-exam duration from config.
      durationSeconds: mini ? 15 * 60 : config.duration_seconds,
    };
    const { data: created, error: createError } = await supabase
      .from("mock_attempts")
      .insert({
        // Server owns the attempt id. The mock_attempts.id column has no DB-side
        // default, so we must supply it here — otherwise the insert fails with a
        // not-null violation and the UI shows "Could not start the test".
        id: crypto.randomUUID(),
        user_id: user.id,
        exam_target: examTarget,
        test_number: (count || 0) + 1,
        status: "in_progress",
        served_question_ids: servedIds,
        started_at: new Date().toISOString(),
        // Seed answers_state so the attempt is resumable immediately — before the
        // first 60s background sync. The resume page reads questions/scoringMap
        // from here; without this an abandoned-early attempt errors on resume.
        answers_state: {
          currentQuestionIndex: 0,
          selectedAnswers: {},
          statuses: {},
          questions: mappedQuestions,
          scoringMap,
          testNumber: (count || 0) + 1,
        },
      })
      .select("id, test_number")
      .single();

    if (createError || !created) {
      console.error("Failed to create server-owned attempt:", createError);
      return { success: false, error: "Could not start the test. Please try again." };
    }

    return {
      success: true,
      questions: mappedQuestions,
      scoringMap,
      focusedSubjects: focusedSubjects.length > 0 ? focusedSubjects : undefined,
      attemptId: created.id,
      testNumber: created.test_number,
    };

  } catch (e: any) {
    console.error("Mock Test Fetch Error:", e);
    const msg = e?.message || "Unknown database error";
    return { success: false, error: `Failed to load test: ${msg}` };
  }
}
