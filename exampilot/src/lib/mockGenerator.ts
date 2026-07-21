import { GoogleGenerativeAI } from "@google/generative-ai";
import { robustJsonParse } from "@/lib/robustJsonParse";

/**
 * Shared mock-question generation used by BOTH the admin "Generate Full Mock"
 * button and the automated every-2-days cron. Centralizing it keeps the prompt,
 * batching, parsing, and — critically — the `review_status: "pending"` gate
 * identical across manual and automated paths, so no AI-generated question can
 * ever reach a live test without human approval.
 */

// Per-exam subject → question-count layout for a full mock. Mirrors
// EXAM_CONFIGS but is duplicated here intentionally so a generation run is a
// self-contained unit (the generator does not need the scoring config).
export const MOCK_SUBJECT_MAP: Record<string, { subject: string; count: number }[]> = {
  AFCAT: [
    { subject: "English", count: 25 },
    { subject: "General Awareness", count: 25 },
    { subject: "Numerical Ability", count: 25 },
    { subject: "Reasoning and Military Aptitude", count: 25 },
  ],
  NDA_MATH: [
    { subject: "Algebra", count: 30 },
    { subject: "Calculus", count: 30 },
    { subject: "Trigonometry and Geometry", count: 30 },
    { subject: "Statistics and Probability", count: 30 },
  ],
  NDA_GAT: [
    { subject: "English", count: 50 },
    { subject: "General Science", count: 50 },
    { subject: "General Studies", count: 50 },
  ],
  CDS: [
    { subject: "English", count: 40 },
    { subject: "General Knowledge", count: 40 },
    { subject: "Elementary Mathematics", count: 40 },
  ],
};

export const SUPPORTED_EXAMS = Object.keys(MOCK_SUBJECT_MAP);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateBatch(model: any, examTarget: string, subject: string, count: number) {
  const batchSize = 10;
  const numBatches = Math.ceil(count / batchSize);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];

  for (let i = 0; i < numBatches; i++) {
    const countForBatch =
      i === numBatches - 1 && count % batchSize !== 0 ? count % batchSize : batchSize;

    const prompt = `CRITICAL: You are generating questions STRICTLY for the Subject: ${subject} for the Exam: ${examTarget}. Do not include questions from any other subject. Generate ${countForBatch} unique, high-yield, highly probable multiple-choice practice questions.

CRITICAL INSTRUCTIONS:
1. Keep explanations under 2 sentences. Do not add any text outside the JSON array.
2. Return STRICTLY a valid JSON array matching this exact schema and NOTHING ELSE. Do NOT include trailing commas. Escape all internal double quotes:
[
  { "question": "Question text here", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 1, "is_pyq": false }
]
3. correct_index must be an integer from 0 to 3.
4. NEVER wrap your JSON in markdown blocks or backticks.`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed = robustJsonParse<any>(raw, []);
      if (!Array.isArray(parsed) && parsed && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      }
      if (Array.isArray(parsed)) all.push(...parsed);
    } catch (e) {
      console.error(`[mockGenerator] batch failed (${examTarget}/${subject}):`, e);
    }
  }
  return all;
}

export interface GeneratedRow {
  question: string;
  options: string[];
  correct_index: number;
  exam_target: string;
  subject: string;
  is_pyq: boolean;
  source_pool: string;
  review_status: string;
}

/**
 * Generates a full mock's worth of questions for one exam and returns the
 * structured rows — every row stamped `review_status: "pending"`. The caller
 * owns insertion so it can use whichever Supabase client it already holds.
 */
export async function generateFullMockRows(examTarget: string): Promise<GeneratedRow[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const subjectMap = MOCK_SUBJECT_MAP[examTarget];
  if (!subjectMap) throw new Error(`Unsupported exam target: ${examTarget}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const rows: GeneratedRow[] = [];
  for (const item of subjectMap) {
    const raw = await generateBatch(model, examTarget, item.subject, item.count);
    for (const q of raw) {
      rows.push({
        question: q.question || q.question_text || q.text,
        options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD],
        correct_index: q.correct_index !== undefined ? q.correct_index : 0,
        exam_target: examTarget,
        subject: item.subject,
        is_pyq: false,
        source_pool: "mock",
        review_status: "pending",
      });
    }
  }
  return rows;
}
