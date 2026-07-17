"use server";

import { createClient } from "@/utils/supabase/server";
import type { GeneratedPlan } from "@/app/actions/planner";
import type { MockTestResult } from "@/app/actions/logMockTest";

// We store completed topics as a flat string-keyed Set at the root of the
// generated_plan JSONB — no SQL migration required.
// Key format: "w{week_number}d{day_number}t{topic_index}"
// e.g. "w1d3t0" = week 1, day 3, first topic.

export type ExtendedPlan = GeneratedPlan & {
  completed_topics?: string[];
  mock_tests?: MockTestResult[];
};

/**
 * Toggles one topic's checked state inside generated_plan.completed_topics.
 * Reads → modifies → writes the JSONB in a single round-trip.
 * Returns the new complete set of completed topic keys so the client can
 * update its local state optimistically without a refetch.
 */
export async function toggleTopic(
  planId: string,
  topicKey: string
): Promise<string[]> {
  const supabase = createClient();

  // Verify the session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");

  // Fetch current JSONB — RLS ensures the user owns this row
  const { data, error: fetchError } = await supabase
    .from("study_plans")
    .select("generated_plan")
    .eq("id", planId)
    .single();

  if (fetchError || !data) {
    throw new Error("Plan not found or access denied.");
  }

  const plan = data.generated_plan as ExtendedPlan;
  const completed = new Set<string>(plan.completed_topics ?? []);

  // Toggle the key
  if (completed.has(topicKey)) {
    completed.delete(topicKey);
  } else {
    completed.add(topicKey);
  }

  const newCompleted = Array.from(completed);
  const updatedPlan: ExtendedPlan = { ...plan, completed_topics: newCompleted };

  const { error: updateError } = await supabase
    .from("study_plans")
    .update({ generated_plan: updatedPlan })
    .eq("id", planId)
    .eq("user_id", user.id); // Belt-and-suspenders on top of RLS

  if (updateError) {
    throw new Error(`Failed to save: ${updateError.message}`);
  }

  return newCompleted;
}
