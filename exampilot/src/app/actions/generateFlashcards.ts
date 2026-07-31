"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { checkAndDeductCredits } from "@/lib/creditManager";
import { robustJsonParse } from "@/lib/robustJsonParse";
import { getWeakestSubjects } from "@/lib/weakSubjects";
import { checkAiRateLimit } from "@/lib/aiRateLimit";

export interface Flashcard {
  question: string;
  answer: string;
}

export type GenerateFlashcardsResult =
  | { success: true; flashcards: Flashcard[]; focusedSubjects?: string[] }
  | { success: false; error: string };

export async function generateFlashcards(): Promise<GenerateFlashcardsResult> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  

  if (authError || !user) {
    return { success: false, error: "You must be signed in." };
  }

  // Per-user AI rate limit: shared 20 req/min ceiling across all AI surfaces
  // (chat, coach, cheat sheet, flashcards, test strategy, study plan). One
  // shared budget per user intentionally — prevents billing exhaustion regardless
  // of which surface is hammered.
  const aiRate = await checkAiRateLimit(user.id);
  if (!aiRate.success) {
    return { success: false, error: "AI_RATE_LIMIT_EXCEEDED" };
  }

  // Fetch the most recent study plan for context
  const { data: plan, error: dbError } = await supabase
    .from("study_plans")
    .select("id, exam_name, generated_plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (dbError || !plan) {
    return { success: false, error: "No study plan found. Please generate a plan first." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Gemini API key is not configured." };
  }

  // Cache Check
  const currentDate = new Date().toISOString().split("T")[0];
  const { data: cached } = await supabase
    .from("daily_flashcards")
    .select("flashcards")
    .eq("user_id", user.id)
    .eq("plan_id", plan.id)
    .eq("generated_date", currentDate)
    .maybeSingle();

  if (cached && cached.flashcards) {
    return { success: true, flashcards: cached.flashcards };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // 1. Lock in the stable model and double the token limit
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 2048, // Increased from 1024 to prevent cutoffs
    },
  });

  const creditCheck = await checkAndDeductCredits(user.id, user.email, 3);
  if (!creditCheck.success) {
    return { success: false, error: "INSUFFICIENT_CREDITS" };
  }

  try {
    const safeExamName = String(plan.exam_name || "").replace(/[^a-zA-Z0-9\s()_-]/g, "").slice(0, 60);
    const weakSubjects = await getWeakestSubjects(safeExamName);

    let prompt = `Act as an expert examiner for ${safeExamName}. Based on this syllabus: ${plan.generated_plan}, generate 5 highly probable, quick-fire flashcards.
    
    CRITICAL INSTRUCTIONS:
    1. Return STRICTLY a JSON array of objects.
    2. Each object must have exactly two keys: "question" and "answer".
    3. NEVER use unescaped double quotes inside your text.
    4. NEVER use raw newlines (Line breaks) inside your text. Keep answers to a single paragraph.
    5. Do NOT wrap the response in markdown blocks.`;

    if (weakSubjects.length > 0) {
      prompt += `\n\n6. The user is currently weakest in these subjects: ${weakSubjects.join(", ")}. Bias the selection so roughly 60% of the flashcards target these specific weak subjects, while the remaining 40% are general review.`;
    }

    prompt += `\n\nCRITICAL: You must return valid JSON only. You must properly escape all internal double quotes using a backslash (\\"). Do not use markdown wrappers.`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // 3. Failsafe cleaning for rogue markdown and trailing commas
    const flashcards = robustJsonParse(rawText, []);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("AI returned invalid data format.");
    }

    const finalFlashcards = flashcards.slice(0, 5);

    // Save to Cache
    await supabase.from("daily_flashcards").insert({
      user_id: user.id,
      plan_id: plan.id,
      generated_date: currentDate,
      flashcards: finalFlashcards,
      focused_subjects: weakSubjects
    });

    return { success: true, flashcards: finalFlashcards, focusedSubjects: weakSubjects };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[generateFlashcards] Error:", error);
    return { success: false, error: "AI_SERVICE_UNAVAILABLE" };
  }
}