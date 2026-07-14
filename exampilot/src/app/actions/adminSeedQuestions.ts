/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/adminAuth";

function robustJsonParse(rawText: string, batchIndex: number = 0, requestedCount: number = 0) {
  let clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  // 1. Strip trailing commas safely
  clean = clean.replace(/,\s*([\]}])/g, '$1');

  // 2. Try parsing the clean string directly first (Best for application/json responses)
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  } catch (e: any) {
    // 3. Fallback: Salvage partial arrays by parsing balanced JSON objects
    const recovered: any[] = [];
    let braceDepth = 0;
    let startIdx = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceDepth === 0) startIdx = i;
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
          if (braceDepth === 0 && startIdx !== -1) {
            const candidate = clean.substring(startIdx, i + 1);
            try {
              recovered.push(JSON.parse(candidate));
            } catch {
              // ignore malformed objects
            }
            startIdx = -1;
          }
        }
      }
    }

    if (recovered.length > 0) {
      console.warn(`[Batch ${batchIndex}] Recovered ${recovered.length} out of ${requestedCount} requested objects from truncated response. Raw length: ${rawText.length}`);
      return recovered;
    }

    // 4. If nothing recovered, throw error with diagnostics
    const msg = e instanceof Error ? e.message : "Unknown error";
    const parsePos = msg.match(/position (\d+)/)?.[1] || "unknown";
    console.error(`[Batch ${batchIndex}] JSON Parse Error at position ${parsePos}. Raw response length: ${rawText.length}`);
    throw new Error(`JSON Parse Error: ${msg} in batch ${batchIndex}. Raw length: ${rawText.length}`);
  }
  throw new Error(`AI returned valid JSON but no array was found in batch ${batchIndex}.`);
}

async function generateQuestionsInBatches(model: any, examTarget: string, isPyq: boolean, subject: string | null, totalRequested: number) {
  const batchSize = 10;
  const numBatches = Math.ceil(totalRequested / batchSize);
  const allParsed: any[] = [];
  
  // Sequentially run batches to avoid rate limits
  for (let i = 0; i < numBatches; i++) {
    const batchIndex = i + 1;
    const countForBatch = (i === numBatches - 1 && totalRequested % batchSize !== 0) 
      ? totalRequested % batchSize 
      : batchSize;
      
    let prompt = `Generate ${countForBatch} unique, high-yield multiple-choice questions for the Indian Defense Exam: ${examTarget}.`;
    if (subject) {
      prompt = `CRITICAL: You are generating questions STRICTLY for the Subject: ${subject} for the Exam:${examTarget}. Do not include questions from any other subject. You need to generate ${countForBatch} unique, high-yield multiple-choice questions.`;
    }
    
    if (isPyq) {
      prompt += `\nThese should closely resemble Previous Year Questions (PYQs).`;
    } else {
      prompt += `\nThese should be highly probable practice questions.`;
    }
    
    prompt += `
    
    CRITICAL INSTRUCTIONS:
    1. Keep explanations under 2 sentences. Do not add any text outside the JSON array.
    2. Return STRICTLY a valid JSON array matching this exact schema and NOTHING ELSE. Do NOT include trailing commas. Escape all internal double quotes:
    [
      {
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 1,
        "is_pyq": ${isPyq}
      }
    ]
    3. The correct_index must be an integer from 0 to 3 corresponding to the correct option in the options array.
    4. NEVER wrap your JSON in markdown blocks or backticks.`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const parsed = robustJsonParse(raw, batchIndex, countForBatch);
      allParsed.push(...parsed);
    } catch (e: any) {
      console.error(`[Batch ${batchIndex}] failed during generation or parsing:`, e.message);
    }
  }

  return allParsed;
}

export async function adminSeedQuestions(examTarget: string, isPyq: boolean = false, sourcePool: string = "booklet", subject: string = "General") {
  const supabase = createClient();
  
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user || !(await checkIsAdmin(authData.user.email))) {
    return { success: false, error: "Unauthorized access to seeding script." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "Gemini API key is missing." };
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Strict model usage as per critical directive - budget increased to 8192
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: { 
      responseMimeType: "application/json", 
      temperature: 0.7, 
      maxOutputTokens: 8192 
    }
  });

  try {
    const rawQuestions = await generateQuestionsInBatches(model, examTarget, isPyq, subject, 30);
    
    if (!rawQuestions || rawQuestions.length === 0) {
      throw new Error("Failed to generate or parse any valid questions across all batches.");
    }

    const structuredPayload = rawQuestions.map((q: any) => ({
      question: q.question || q.question_text || q.text,
      options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD],
      correct_index: q.correct_index !== undefined ? q.correct_index : (q.correct_answer ? (q.options?.indexOf(q.correct_answer) || 0) : 0),
      exam_target: examTarget,
      subject: subject,
      is_pyq: !!isPyq,
      source_pool: sourcePool
    }));

    // Bulk Insert
    const { error: dbError } = await supabase.from("question_bank").insert(structuredPayload);
    
    if (dbError) throw new Error(`Database Error: ${dbError.message || JSON.stringify(dbError)}`);

    return { success: true, count: structuredPayload.length };

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function generateFullMockTest(examTarget: string) {
  const supabase = createClient();
  
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user || !(await checkIsAdmin(authData.user.email))) {
    return { success: false, error: "Unauthorized access to seeding script." };
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

  // Map subjects and quantities based on examTarget
  let subjectMapping: { subject: string; count: number }[] = [];

  if (examTarget === "AFCAT") {
    subjectMapping = [
      { subject: "English", count: 25 },
      { subject: "General Awareness", count: 25 },
      { subject: "Numerical Ability", count: 25 },
      { subject: "Reasoning and Military Aptitude", count: 25 }
    ];
  } else if (examTarget === "NDA_MATH") {
    subjectMapping = [
      { subject: "Algebra", count: 30 },
      { subject: "Calculus", count: 30 },
      { subject: "Trigonometry and Geometry", count: 30 },
      { subject: "Statistics and Probability", count: 30 }
    ];
  } else if (examTarget === "NDA_GAT") {
    subjectMapping = [
      { subject: "English", count: 50 },
      { subject: "General Science", count: 50 },
      { subject: "General Studies", count: 50 }
    ];
  } else {
    // Default fallback (CDS or custom)
    subjectMapping = [
      { subject: "English", count: 40 },
      { subject: "General Knowledge", count: 40 },
      { subject: "Elementary Mathematics", count: 40 }
    ];
  }

  let allQuestions: any[] = [];

  try {
    for (const item of subjectMapping) {
      const rawQuestions = await generateQuestionsInBatches(model, examTarget, false, item.subject, item.count);
      
      const structuredPayload = rawQuestions.map((q: any) => ({
        question: q.question || q.question_text || q.text,
        options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD],
        correct_index: q.correct_index !== undefined ? q.correct_index : (q.correct_answer ? (q.options?.indexOf(q.correct_answer) || 0) : 0),
        exam_target: examTarget,
        subject: item.subject,
        is_pyq: false,
        source_pool: "mock"
      }));

      allQuestions = allQuestions.concat(structuredPayload);
    }

    // Bulk Insert all generated questions
    if (allQuestions.length > 0) {
      const { error: dbError } = await supabase.from("question_bank").insert(allQuestions);
      if (dbError) throw new Error(`Database Error: ${dbError.message || JSON.stringify(dbError)}`);
    }

    return { success: true, count: allQuestions.length };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: msg };
  }
}
