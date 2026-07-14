"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { checkAndDeductCredits } from "@/lib/creditManager";

export async function generateTestStrategy(
  score: number,
  maxScore: number,
  incorrectSubjects: string[],
  studentArchetype: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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
  
  // Use flash model as requested for fast, textual generation
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: { 
      temperature: 0.7, 
      maxOutputTokens: 800 
    }
  });

  const subjectsContext = incorrectSubjects.length > 0 
    ? `They missed questions in the following subjects: ${incorrectSubjects.join(", ")}.`
    : `They scored a perfect test!`;

  const prompt = `You are an elite defense exam tactical coach. Analyze this test result. The student scored ${score} out of ${maxScore}. ${subjectsContext}
  
The student learns best via the "${studentArchetype}" archetype. You must output a JSON object with exactly two keys: "weaknesses" (a short string summarizing their critical weaknesses) and "actionPlan" (an array of 3 actionable string steps for tomorrow). Keep the tone focused, tactical, and encouraging. Return ONLY the JSON object.`;

  function extractJSON(text: string) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON object or array found in text.");
    return match[0];
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    let strategyData;
    try {
      const cleanJson = extractJSON(text);
      strategyData = JSON.parse(cleanJson);
      
      // Basic validation
      if (!strategyData.weaknesses || !Array.isArray(strategyData.actionPlan)) {
        throw new Error("Invalid JSON structure returned by AI");
      }
    } catch (parseError) {
      console.error("AI JSON parsing failed, using fallback. Error:", parseError, "Raw output:", text);
      strategyData = {
        weaknesses: "Analysis offline. Proceed with standard debriefing protocols.",
        actionPlan: [
          "Review the standard answer key below for all incorrect responses.",
          "Identify the core concepts or formulas you struggled with the most.",
          "Practice 10 similar questions from the question bank to reinforce those concepts."
        ]
      };
    }
    
    return { success: true, strategy: strategyData };
  } catch (error) {
    console.error("AI Strategy generation failed:", error);
    return { 
      success: false, 
      error: 'AI_SERVICE_UNAVAILABLE',
      message: 'The AI service is currently busy. Please try again in a few moments.'
    };
  }
}
