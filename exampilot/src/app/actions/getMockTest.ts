"use server";

import { createClient } from "@/utils/supabase/server";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
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
  | { success: true; questions: Question[]; scoringMap: ScoringMap }
  | { success: false; error: string; shortage?: boolean };

const EXAM_CONFIGS = {
  "AFCAT": { limit: 100, correct: 3, incorrect: -1 },
  "NDA_MATH": { limit: 120, correct: 2.5, incorrect: -0.83 },
  "NDA_GAT": { limit: 150, correct: 4, incorrect: -1.33 },
  "CDS": { limit: 120, correct: 0.83, incorrect: -0.27 },
};

export async function getMockTest(examTarget: string, mini: boolean = false): Promise<GetTestResult> {
  const supabase = createClient();
  const config = EXAM_CONFIGS[examTarget as keyof typeof EXAM_CONFIGS];
  
  if (!config) {
    return { success: false, error: "Invalid exam target for test generation." };
  }

  const totalQuestions = mini ? 15 : config.limit;
  const pyqTarget = Math.floor(totalQuestions * 0.25); // Target ~25% PYQs

  try {
    // 1. Fetch PYQs
    const { data: pyqData, error: pyqError } = await supabase
      .from("question_bank")
      .select("id, question, options, correct_index, subject, is_pyq, pyq_year")
      .eq("exam_target", examTarget)
      .eq("source_pool", "mock")
      .eq("is_pyq", true)
      .neq("subject", "Current Affairs")
      .limit(pyqTarget);

    if (pyqError) throw pyqError;

    const fetchedPyqs = pyqData || [];

    // 2. Fetch standard questions
    const standardLimit = totalQuestions - fetchedPyqs.length;
    const { data: standardData, error: stdError } = await supabase
      .from("question_bank")
      .select("id, question, options, correct_index, subject, is_pyq, pyq_year")
      .eq("exam_target", examTarget)
      .eq("source_pool", "mock")
      .eq("is_pyq", false)
      .neq("subject", "Current Affairs")
      .limit(standardLimit);
      
    if (stdError) throw stdError;

    const fetchedStandard = standardData || [];
    
    // Combine results
    const combined = [...fetchedPyqs, ...fetchedStandard];
    
    if (combined.length === 0) {
      return { 
        success: false, 
        error: "Question bank is currently being replenished. Check back soon!", 
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
      correctIndex: q.correct_index,
      subject: q.subject || "General",
      isPyq: q.is_pyq,
      pyqYear: q.pyq_year
    }));

    return { 
      success: true, 
      questions: mappedQuestions, 
      scoringMap: { correct: config.correct, incorrect: config.incorrect } 
    };

  } catch (e: any) {
    console.error("Mock Test Fetch Error:", e);
    const msg = e?.message || "Unknown database error";
    return { success: false, error: `Failed to load test: ${msg}` };
  }
}
