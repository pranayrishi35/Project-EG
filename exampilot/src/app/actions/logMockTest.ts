"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Type ──────────────────────────────────────────────────────────────────────

export interface MockTestResult {
  id: string;          // timestamp-based unique ID
  date: string;        // ISO date string
  attempted: number;
  correct: number;
  incorrect: number;
  totalScore: number;  // (correct * mpc) - (incorrect * pip)
  accuracy: number;    // (correct / attempted) * 100, rounded to 1 dp
  marksPerCorrect: number;
  penaltyPerIncorrect: number;
}

// ─── Server Action ─────────────────────────────────────────────────────────────

/**
 * Appends a new mock test result to the generated_plan JSONB.
 * No SQL migration required — mock_tests is stored as a top-level
 * key inside the existing JSONB column.
 *
 * Returns the updated mock_tests array so the client can sync state.
 */
export async function logMockTest(
  planId: string,
  result: MockTestResult
): Promise<MockTestResult[]> {
  if (!planId) throw new Error("Missing plan ID.");

  const supabase = createClient();

  // ── Auth check ──────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be signed in.");

  // ── Fetch current JSONB ─────────────────────────────────────────────────────
  const { data, error: fetchError } = await supabase
    .from("study_plans")
    .select("generated_plan")
    .eq("id", planId)
    .eq("user_id", user.id) // belt-and-suspenders
    .single();

  if (fetchError || !data) {
    throw new Error("Plan not found or access denied.");
  }

  const plan = data.generated_plan as Record<string, unknown> & {
    mock_tests?: MockTestResult[];
  };

  const existing: MockTestResult[] = Array.isArray(plan.mock_tests)
    ? plan.mock_tests
    : [];

  const updated = [...existing, result];
  const updatedPlan = { ...plan, mock_tests: updated };

  // ── Persist ──────────────────────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("study_plans")
    .update({ generated_plan: updatedPlan })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`Failed to save: ${updateError.message}`);
  }

  revalidatePath(`/planner/${planId}`);
  revalidatePath("/planner");

  return updated;
}

/**
 * Deletes a single mock test by id from the JSONB array.
 */
export async function deleteMockTest(
  planId: string,
  testId: string
): Promise<MockTestResult[]> {
  if (!planId || !testId) throw new Error("Missing IDs.");

  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be signed in.");

  const { data, error: fetchError } = await supabase
    .from("study_plans")
    .select("generated_plan")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !data) throw new Error("Plan not found.");

  const plan = data.generated_plan as Record<string, unknown> & {
    mock_tests?: MockTestResult[];
  };

  const filtered = (plan.mock_tests ?? []).filter((t) => t.id !== testId);
  const updatedPlan = { ...plan, mock_tests: filtered };

  const { error: updateError } = await supabase
    .from("study_plans")
    .update({ generated_plan: updatedPlan })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(`Failed to delete: ${updateError.message}`);

  revalidatePath(`/planner/${planId}`);
  return filtered;
}
