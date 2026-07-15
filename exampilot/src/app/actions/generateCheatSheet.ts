"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { checkAndDeductCredits } from "@/lib/creditManager";
import { robustJsonParse } from "@/lib/robustJsonParse";

export interface CheatSheetSection {
  subject: string;
  points: string[];
}

export type GenerateCheatSheetResult =
  | { success: true; cheatSheet: CheatSheetSection[] }
  | { success: false; error: string };

export async function generateCheatSheet(planId: string): Promise<GenerateCheatSheetResult> {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return { success: false, error: "You must be signed in." };
  }

  // Fetch the specific study plan
  const { data: plan, error: dbError } = await supabase
    .from("study_plans")
    .select("exam_name, generated_plan")
    .eq("id", planId)
    .eq("user_id", authData.user.id)
    .single();

  if (dbError || !plan) {
    return { success: false, error: "Study plan not found." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Gemini API key is not configured." };
  }

  // Cache Check
  const { data: cached } = await supabase
    .from("cheat_sheets")
    .select("content")
    .eq("plan_id", planId)
    .maybeSingle();

  if (cached && cached.content) {
    return { success: true, cheatSheet: cached.content };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3, // low temperature for structured factual data
      maxOutputTokens: 2048,
    },
    systemInstruction: `Act as an expert tutor for Indian Defense Exams (${plan.exam_name}). Do NOT just spit out the syllabus. Generate high-yield, subject-wise revision notes and top 5 formulas/facts. Return STRICTLY a JSON object matching this schema: { "cheatSheet": [ { "subject": "...", "points": ["..."] } ] }`,
  });

  const creditCheck = await checkAndDeductCredits(authData.user.id, authData.user.email, 5);
  if (!creditCheck.success) {
    return { success: false, error: "INSUFFICIENT_CREDITS" };
  }

  try {
    const prompt = `Act as an expert tutor for Indian Defense Exams (${plan.exam_name}). Based on this syllabus, do NOT just output the syllabus list. Generate high-yield, subject-wise revision notes and top 5 formulas/facts for last-minute revision. 
    
    CRITICAL INSTRUCTIONS:
    1. Return STRICTLY a JSON object.
    2. Do NOT wrap the JSON in markdown code blocks or backticks.
    3. Do NOT use unescaped quotes inside your text.
    4. Match this exact schema:
    { "cheatSheet": [ { "subject": "Subject Name", "points": ["Fact 1", "Fact 2"] } ] }`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    // Aggressively strip out markdown code blocks just in case Gemini hallucinates them
    const parsedData = robustJsonParse(rawText);

    // Flexibly grab the array whether Gemini returned it directly or wrapped it in the object
    const cheatSheet = Array.isArray(parsedData)
      ? parsedData
      : (parsedData.cheatSheet || []);

    if (!Array.isArray(cheatSheet) || cheatSheet.length === 0) {
      throw new Error("AI returned JSON, but no cheat sheet data was found inside.");
    }

    // Save to Cache
    await supabase.from("cheat_sheets").insert({
      plan_id: planId,
      content: cheatSheet
    });

    return { success: true, cheatSheet };
  } catch (error: unknown) {
    console.error("[generateCheatSheet] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Failed to generate cheat sheet: ${message}` };
  }
}