"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type DeletePlanResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Deletes a study plan row from Supabase.
 * - Auth is verified before the query.
 * - The DELETE filter includes user_id as a belt-and-suspenders guard
 *   on top of RLS so no user can delete another user's plan.
 * - Revalidates /planner and / so the history list and streak badge
 *   refresh immediately without a full reload.
 */
import { z } from "zod";

const DeletePlanSchema = z.object({
  planId: z.string().min(1),
});

export async function deletePlan(rawPlanId: string): Promise<DeletePlanResult> {
  const parsed = DeletePlanSchema.safeParse({ planId: rawPlanId });
  if (!parsed.success) {
    return { success: false, error: "Invalid plan ID." };
  }
  const { planId } = parsed.data;

  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");

  const { error: deleteError } = await supabase
    .from("study_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id); // belt-and-suspenders on top of RLS

  if (deleteError) {
    console.error("[deletePlan] Supabase error:", deleteError);
    return {
      success: false,
      error: `Failed to delete: ${deleteError.message}`,
    };
  }

  // Refresh the planner history list and home page streak badge
  revalidatePath("/planner");
  revalidatePath("/");

  return { success: true };
}
