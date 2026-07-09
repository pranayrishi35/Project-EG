"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlanDay {
  day_number: number;
  topics: string[];
  estimated_hours: number;
  is_revision: boolean;
}

export interface PlanWeek {
  week_number: number;
  days: PlanDay[];
}

export interface GeneratedPlan {
  weeks: PlanWeek[];
}

export type GeneratePlanResult =
  | { success: true; planId: string }
  | { success: false; error: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a File (from FormData) into a Gemini inlineData Part.
 * We use arrayBuffer → Uint8Array → base64 string so no fs module is needed
 * (keeps this compatible with the Next.js edge-compatible server action runtime).
 */
async function fileToInlinePart(file: File): Promise<Part> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  // Convert Uint8Array to base64 without Buffer (works in all runtimes)
  let binary = "";
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return {
    inlineData: {
      data: base64,
      mimeType: file.type as
        | "application/pdf"
        | "image/png"
        | "image/jpeg"
        | "image/webp",
    },
  };
}

/**
 * Calculate the number of days between today and the exam date.
 * Uses pure Date math — no external libraries needed.
 */
function daysUntilExam(examDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalise to midnight local time
  const exam = new Date(examDateStr);
  exam.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.round((exam.getTime() - today.getTime()) / msPerDay));
}

// ─── System Prompt Builder ─────────────────────────────────────────────────────

function buildSystemPrompt(examName: string, examDate: string, daysLeft: number): string {
  return `
You are an elite academic counselor specializing in Indian competitive and university exams 
(JEE, NEET, UPSC, GATE, CUET, and University Semester examinations).

## CONTEXT
- Exam: ${examName}
- Exam Date: ${examDate}
- Days Remaining: ${daysLeft} days
- Today's Date: ${new Date().toISOString().split("T")[0]}

## YOUR TASK
Analyse the attached syllabus document/image carefully. Identify every subject, unit, and chapter.

Then construct a realistic, highly organised **day-by-day study timeline** that covers:
1. All syllabus topics spread evenly across the available ${daysLeft} days
2. Regular **revision windows** (every 7th day should be a revision day)
3. At least **2 full mock exam days** in the final 10% of the timeline
4. A lighter load in the final 3 days for rest and last-minute revision

## RULES
- Be specific with topic names — do NOT use vague labels like "Study Math"
- Each study day should have 2–5 focused topics
- Estimated hours per day should be realistic (4–8 hours max for a student)
- Revision days should explicitly list the topics being revised
- Mock exam days should have topics: ["Full Mock Exam", "Analysis & Weak Area Review"]
- If no syllabus is attached, create a general high-yield plan for ${examName}

## OUTPUT FORMAT
Respond with ONLY a valid JSON object following this exact structure — no markdown, no explanation:

{
  "weeks": [
    {
      "week_number": 1,
      "days": [
        {
          "day_number": 1,
          "topics": ["Topic A", "Topic B"],
          "estimated_hours": 4,
          "is_revision": false
        }
      ]
    }
  ]
}
`.trim();
}

// ─── Main Server Action ────────────────────────────────────────────────────────

export async function generateStudyPlan(
  formData: FormData
): Promise<GeneratePlanResult> {
  // ── 1. Extract form fields ──────────────────────────────────────────────────
  const examName = (formData.get("examName") as string | null)?.trim();
  const examDate = (formData.get("examDate") as string | null)?.trim();
  const syllabusFile = formData.get("syllabusFile") as File | null;

  if (!examName || examName.length < 2) {
    return { success: false, error: "Please enter a valid exam name." };
  }
  if (!examDate) {
    return { success: false, error: "Please select a valid exam date." };
  }

  // ── 2. Validate authenticated user ─────────────────────────────────────────
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "You must be signed in to generate a study plan.",
    };
  }

  // ── 3. Prepare Gemini client ────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      // Force strict JSON output — no markdown wrapping
      responseMimeType: "application/json",
      temperature: 0.4,      // Low temp for structured, reproducible output
      maxOutputTokens: 8192, // Enough for a 90-day detailed schedule
    },
    systemInstruction: buildSystemPrompt(
      examName,
      examDate,
      daysUntilExam(examDate)
    ),
  });

  // ── 4. Build the parts array (text prompt + optional file) ─────────────────
  const parts: Part[] = [
    {
      text: syllabusFile && syllabusFile.size > 0
        ? "Analyse this syllabus and generate the study plan as instructed."
        : "No syllabus file was provided. Generate a comprehensive study plan based on the standard syllabus for this exam.",
    },
  ];

  // Attach the file if present and non-empty
  if (syllabusFile && syllabusFile.size > 0) {
    try {
      const filePart = await fileToInlinePart(syllabusFile);
      parts.push(filePart);
    } catch (fileError) {
      console.error("[generateStudyPlan] File conversion error:", fileError);
      // Non-fatal: fall back to text-only generation
    }
  }

  // ── 5. Call Gemini and parse JSON ──────────────────────────────────────────
  let generatedPlan: GeneratedPlan;
  try {
    const result = await model.generateContent(parts);
    const rawText = result.response.text();

    // responseMimeType: "application/json" means the model returns pure JSON,
    // but we defensively strip any accidental markdown fences.
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    generatedPlan = JSON.parse(cleaned) as GeneratedPlan;

    // Basic structural validation
    if (!Array.isArray(generatedPlan?.weeks)) {
      throw new Error("Gemini response is missing the 'weeks' array.");
    }
  } catch (geminiError: unknown) {
    console.error("[generateStudyPlan] Gemini error:", geminiError);
    const message =
      geminiError instanceof Error ? geminiError.message : "Unknown error";
    return {
      success: false,
      error: `AI generation failed: ${message}. Please try again.`,
    };
  }

  // ── 6. Save to Supabase ────────────────────────────────────────────────────
  try {
    const { data, error: dbError } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        exam_name: examName,
        exam_date: examDate,
        // syllabusFile is binary — store only the filename for reference
        syllabus_text: syllabusFile?.name ?? null,
        generated_plan: generatedPlan, // Supabase accepts JS objects for JSONB
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[generateStudyPlan] Supabase insert error:", dbError);
      return {
        success: false,
        error: `Failed to save your plan: ${dbError.message}`,
      };
    }

    return { success: true, planId: data.id as string };
  } catch (dbError: unknown) {
    console.error("[generateStudyPlan] Unexpected DB error:", dbError);
    return {
      success: false,
      error: "A database error occurred. Please try again.",
    };
  }
}
