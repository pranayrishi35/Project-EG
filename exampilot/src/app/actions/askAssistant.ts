"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export type AskAssistantResult =
  | { success: true; reply: string }
  | { success: false; error: string };

export async function askAssistant(prompt: string): Promise<AskAssistantResult> {
  if (!prompt || prompt.trim() === "") {
    return { success: false, error: "Prompt cannot be empty." };
  }

  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return { success: false, error: "You must be signed in to use the assistant." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Gemini API key is not configured." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // CRITICAL DIRECTIVE: using gemini-3.1-flash-lite to respect API rate limits.
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
    },
    systemInstruction: `You are ExamPilot's AI Study Assistant.
You are laser-focused on exam preparation. 
Your ONLY purpose is to answer questions about:
1. Exam concepts and academic subjects.
2. Study strategies, time management, and revision techniques.
3. Navigating and using the ExamPilot app.

If the user asks about ANYTHING unrelated to the above topics (e.g., politics, coding, recipes, general chit-chat unrelated to studying), you MUST politely refuse and state that you are laser-focused on exam prep. Be concise, encouraging, and helpful in your valid responses.

FORMATTING RULES: You must optimize for extreme readability on a small mobile screen. 1) NEVER write a wall of text. Break your response into micro-paragraphs of 1 to 2 sentences max. 2) Aggressively use bullet points for lists or steps. 3) Use emojis to make the tone friendly and interactive. 4) Be concise, punchy, and highly encouraging.`,
  });

  try {
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    
    if (!reply) {
      throw new Error("Empty response from AI.");
    }

    return { success: true, reply };
  } catch (error: unknown) {
    console.error("[askAssistant] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Failed to get response: ${message}` };
  }
}
