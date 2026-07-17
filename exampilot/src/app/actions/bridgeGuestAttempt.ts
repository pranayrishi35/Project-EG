"use server";

import { createClient } from "@/utils/supabase/server";
import { getDemoAnswerKey, getDemoMockQuestions } from "./getDemoMock";

export async function bridgeGuestAttempt(guestAttempt: any) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Double check if a demo mock already exists for this user to prevent spam
  const { data: existing } = await supabase
    .from("mock_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("exam_id", "DEMO_MOCK")
    .maybeSingle();

  if (existing) {
    return { success: true, message: "Demo mock already bridged." };
  }

  try {
    const { selectedAnswers = {}, statuses = {}, timeRemaining = 300 } = guestAttempt;

    // Fetch questions and answers using existing admin actions
    const [questionsRes, answersRes] = await Promise.all([
      getDemoMockQuestions(),
      getDemoAnswerKey(Object.keys(selectedAnswers)) // The action safely filters internally
    ]);

    if (!questionsRes.success || !questionsRes.questions) {
      throw new Error("Failed to load demo questions.");
    }
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    const truthMap = new Map();
    if (answersRes.success && answersRes.answers) {
      answersRes.answers.forEach(a => truthMap.set(a.id, a.correct_index));
    }

    // Process questions and build answer state
    const answers_state = {
      selectedAnswers,
      statuses,
      questions: questionsRes.questions.map(q => ({
        ...q,
        correctIndex: truthMap.get(q.id)
      })),
      testNumber: 0
    };

    questionsRes.questions.forEach(q => {
      const qStatus = statuses[q.id] || "unvisited";
      const isConsidered = qStatus === "answered" || qStatus === "answered_and_marked";
      
      if (isConsidered) {
        const selected = selectedAnswers[q.id];
        const realCorrectIndex = truthMap.get(q.id);
        if (realCorrectIndex !== undefined && selected === realCorrectIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    // Score calculation matching DemoTestRunner logic (4 marks for correct, -1 for incorrect)
    const finalScore = (correctCount * 4) - (incorrectCount * 1);

    const payloadToSave = {
      user_id: user.id,
      exam_id: "DEMO_MOCK",
      test_number: 0,
      status: "completed",
      score: finalScore,
      time_remaining: timeRemaining,
      answers_state,
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from("mock_attempts")
      .insert(payloadToSave);

    if (insertError) {
      throw insertError;
    }

    return { success: true, message: "Guest attempt successfully bridged." };

  } catch (error: any) {
    console.error("[bridgeGuestAttempt] Error:", error);
    return { success: false, error: error.message };
  }
}
