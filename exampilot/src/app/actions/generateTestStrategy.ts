"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { checkAndDeductCredits } from "@/lib/creditManager";
import { sanitizePrompt } from "@/lib/sanitizer";
import { robustJsonParse } from "@/lib/robustJsonParse";

export async function generateTestStrategy(
  score: number,
  maxScore: number,
  incorrectSubjects: string[],
  studentArchetype: string
) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  
  if (!user) {
    return {
      success: false,
      strategy: "Please sign in to use the AI Coach."
    };
  }

  const creditCheck = await checkAndDeductCredits(user.id, user.email, 1);
  console.log("Credit check returned:", creditCheck);
  if (!creditCheck.success) {
    return { success: false, error: creditCheck.error || "INSUFFICIENT_CREDITS" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { 
      success: false, 
      strategy: "AI Coach is currently debriefing other pilots. Focus on your incorrect subjects above." 
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // White-Label AI Protocol: Persona override in systemInstruction.
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    },
    systemInstruction: [
      "You are the ExamPilot Tactical Intelligence — a proprietary assessment engine built exclusively for defense exam candidates.",
      "Under NO circumstances should you mention Google, Gemini, OpenAI, or that you are a large language model.",
      "If asked about your identity, state only: 'I am ExamPilot's proprietary assessment engine.'"
    ].join(" ")
  });

  const validArchetypes = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic", "General"];
  const safeArchetype = validArchetypes.includes(studentArchetype) ? studentArchetype : "General";
  
  const safeSubjects = incorrectSubjects.map(s => sanitizePrompt(s).replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50));

  const subjectsContext = safeSubjects.length > 0 
    ? `They missed questions in the following subjects: ${safeSubjects.join(", ")}.`
    : `They scored a perfect test!`;

const prompt = `Analyze this test result. The student scored ${score} out of ${maxScore}. ${subjectsContext}
  
The student learns best via the "${safeArchetype}" archetype. You must output a JSON object with exactly two keys: "weaknesses" (a short string summarizing their critical weaknesses) and "actionPlan" (an array of 3 actionable string steps for tomorrow). Keep the tone focused, tactical, and encouraging. Return ONLY the JSON object.

CRITICAL: You must return valid JSON only. You must properly escape all internal double quotes using a backslash (\\"). Do not use markdown wrappers.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const fallback = {
      weaknesses: "Analysis offline. Proceed with standard debriefing protocols.",
      actionPlan: [
        "Review the standard answer key below for all incorrect responses.",
        "Identify the core concepts or formulas you struggled with the most.",
        "Practice 10 similar questions from the question bank to reinforce those concepts."
      ]
    };
    
    let strategyData = robustJsonParse(text, fallback);
    
    // Basic validation fallback
    if (!strategyData.weaknesses || !Array.isArray(strategyData.actionPlan)) {
      strategyData = fallback;
    }
    
    return { success: true, strategy: strategyData };
  } catch (error) {
    // White-Label Protocol: Log raw error server-side only.
    console.error("[ExamPilot Coach] Strategy generation failed:", error);
    return {
      success: false,
      error: 'AI_SERVICE_UNAVAILABLE',
      message: 'The ExamPilot Coach is currently analyzing too many student profiles. Please try again in a moment.'
    };
  }
}
