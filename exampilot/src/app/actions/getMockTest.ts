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
}

export type GetTestResult = 
  | { success: true; questions: Question[]; scoringMap: ScoringMap; focusedSubjects?: string[] }
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
    return { success: false, error: "Invalid exam target for test generation." };
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

    return { 
      success: true, 
      questions: mappedQuestions,
      scoringMap: {
        correct: config.marks_per_correct,
        incorrect: config.negative_marking
      },
      focusedSubjects: focusedSubjects.length > 0 ? focusedSubjects : undefined
    };

  } catch (e: any) {
    console.error("Mock Test Fetch Error:", e);
    const msg = e?.message || "Unknown database error";
    return { success: false, error: `Failed to load test: ${msg}` };
  }
}
