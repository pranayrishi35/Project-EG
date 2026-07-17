"use server";
import { createClient } from "@supabase/supabase-js";
import { Question } from "@/app/actions/getMockTest";

const DEMO_QUESTION_IDS = [
  "4e498072-1833-4fb3-9df0-e2f3f1708592",
  "ddafc058-a35c-4a46-af33-1bc6554d673b",
  "a0334f5e-c207-4272-8bf3-b1af07d1832a",
  "6efa4c82-a640-40cb-bceb-02f0d8b27dad",
  "bf8dd795-89b5-435f-8513-383214b69200",
  "9ebab7d2-977c-4e55-834d-3d3893c2e533",
  "24795979-e658-40ac-93b2-f8d887b6e8eb",
  "5d6dae44-3233-49cb-abfe-ac3d16a913dc",
  "b8efa128-7668-417d-b455-6f0b8eb416e0",
  "a1d93ddb-d32e-4785-9a61-37fb2370f795"
];

export async function getDemoQuestionIds() {
  return DEMO_QUESTION_IDS;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getDemoMockQuestions(): Promise<{ success: boolean; questions?: Question[]; error?: string }> {
  try {
    const adminClient = getAdminClient();
    
    // Explicitly omit correct_index
    const { data, error } = await adminClient
      .from("question_bank")
      .select("id, question, options, subject, is_pyq, pyq_year, text")
      .in("id", DEMO_QUESTION_IDS);
      
    if (error) {
      throw error;
    }
    
    // Reorder data to match DEMO_QUESTION_IDS array order (optional, but good for stability)
    const sortedData = DEMO_QUESTION_IDS.map(id => data.find(q => q.id === id)).filter(Boolean);

    const questions: Question[] = sortedData.map((row: any) => ({
      id: row.id,
      text: row.text || row.question || "",
      options: row.options || [],
      subject: row.subject || "",
      isPyq: row.is_pyq || false,
      pyqYear: row.pyq_year,
    }));

    return { success: true, questions };
  } catch (error: any) {
    console.error("Error fetching demo questions:", error);
    return { success: false, error: error.message };
  }
}

export async function getDemoAnswerKey(questionIds: string[]): Promise<{ success: boolean; answers?: { id: string, correct_index: number }[]; error?: string }> {
  try {
    // Only return answers for requested IDs, and intersect with DEMO_QUESTION_IDS to prevent scraping the whole DB
    const safeIds = questionIds.filter(id => DEMO_QUESTION_IDS.includes(id));
    if (safeIds.length === 0) return { success: true, answers: [] };

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("question_bank")
      .select("id, correct_index")
      .in("id", safeIds);
      
    if (error) {
      throw error;
    }
    
    return { success: true, answers: data as { id: string, correct_index: number }[] };
  } catch (error: any) {
    console.error("Error fetching demo answers:", error);
    return { success: false, error: error.message };
  }
}
