"use server";

import { createClient } from "@/utils/supabase/server";
import { Question, GetTestResult } from "@/app/actions/getMockTest";

export async function getCurrentAffairsTest(): Promise<GetTestResult> {
  const supabase = createClient();
  const limit = 15; // Mini-Test size

  try {
    const { data, error } = await supabase
      .from("question_bank")
      .select("*")
      .eq("subject", "Current Affairs")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    const fetched = data || [];
    
    if (fetched.length === 0) {
      return { 
        success: false, 
        error: "No Current Affairs questions available. Please extract MCQs from the news pipeline first."
      };
    }

    // Shuffle the fetched questions (Fisher-Yates)
    for (let i = fetched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fetched[i], fetched[j]] = [fetched[j], fetched[i]];
    }

    const mappedQuestions: Question[] = fetched.map(q => ({
      id: q.id,
      text: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      subject: q.subject || "Current Affairs",
      isPyq: q.is_pyq,
      pyqYear: q.pyq_year
    }));

    // Standard Mini-Test scoring: +1 for correct, -0.33 for incorrect
    return { 
      success: true, 
      questions: mappedQuestions, 
      scoringMap: { correct: 1, incorrect: -0.33 } 
    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown database error";
    return { success: false, error: `Failed to load Current Affairs test: ${msg}` };
  }
}
