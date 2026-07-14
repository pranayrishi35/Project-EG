"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export async function generateNewsMCQs() {
  const supabase = createClient();
  
  // Strict admin check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return { success: false, error: "Unauthorized access." };
  }

  // Get news from the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: newsData, error: newsError } = await supabase
    .from("news_cache")
    .select("headline, summary, source_url")
    .gte("fetched_at", yesterday);
    
  if (newsError) {
    return { success: false, error: `Failed to fetch news cache: ${newsError.message}` };
  }
  
  if (!newsData || newsData.length === 0) {
    return { success: false, error: "No recent news found in the cache. Trigger a fetch first." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "Gemini API key is missing." };
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: { 
      responseMimeType: "application/json", 
      temperature: 0.7, 
      maxOutputTokens: 8192 
    }
  });

  const allQuestions: any[] = [];
  
  // Process news in chunks of 5 articles to prevent context bloat
  const chunkSize = 5;
  for (let i = 0; i < newsData.length; i += chunkSize) {
    const chunk = newsData.slice(i, i + chunkSize);
    const articlesText = chunk.map(a => `Headline: ${a.headline}\nSummary: ${a.summary}`).join("\n\n---\n\n");
    
    const prompt = `You are an expert Indian Defense Exam setter. You are generating questions for the CURRENT AFFAIRS section only. Review the following recent news articles.
Identify ONLY the articles that contain highly exam-relevant facts (e.g., defense technology, military exercises, significant sports milestones, major current affairs).
For EACH relevant article, generate exactly 1 multiple-choice question. If an article is fluff or irrelevant, skip it.

Articles:
${articlesText}

CRITICAL INSTRUCTIONS:
1. Return STRICTLY a valid JSON array matching this exact schema and NOTHING ELSE.
2. Escape all internal double quotes. Do NOT include trailing commas.
[
  {
    "question": "Question text based on the news here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 1
  }
]
3. NEVER wrap your JSON in markdown blocks or backticks.`;

    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        allQuestions.push(...parsed);
      }
    } catch (e: any) {
      console.error("News-to-MCQ failed for a batch:", e.message);
    }
  }

  if (allQuestions.length === 0) {
    return { success: false, error: "AI could not generate any valid questions from the recent news." };
  }

  // Map to robust strict payload
  const structuredPayload = allQuestions.map((q: any) => ({
    question: q.question || q.question_text || q.text,
    options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD],
    correct_index: q.correct_index !== undefined ? q.correct_index : 0,
    exam_target: "CDS", // Defaulting to CDS (Current Affairs heavy)
    subject: "Current Affairs",
    is_pyq: false,
    source_pool: "mock" // Routing to dynamic pool
  }));

  // Bulk Insert
  const { error: dbError } = await supabase.from("question_bank").insert(structuredPayload);
  
  if (dbError) {
    return { success: false, error: `Database Error: ${dbError.message}` };
  }

  return { success: true, count: structuredPayload.length };
}
