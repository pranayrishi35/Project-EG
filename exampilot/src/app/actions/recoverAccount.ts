"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { redirect } from "next/navigation";

export async function recoverAccount() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to recover your account." };
    }

    // is_deleted / deletion_deadline are REVOKEd from the client-facing role, so
    // clearing the deletion flags must run through the service role. Ownership is
    // enforced via the authenticated session above.
    const admin = getAdminClient();
    const { data: updated, error } = await admin
      .from("user_profiles")
      .update({
        is_deleted: false,
        deletion_deadline: null,
      })
      .eq("user_id", user.id)
      .select("user_id");

    if (error) {
      console.error("Failed to recover account:", error);
      return { success: false, error: "Failed to recover account" };
    }

    if (!updated || updated.length !== 1) {
      console.error("Account recovery affected an unexpected number of rows:", updated?.length ?? 0);
      return { success: false, error: "Failed to recover account" };
    }
  } catch (err) {
    console.error("Unexpected error during account recovery:", err);
    return { success: false, error: "An unexpected error occurred" };
  }

  redirect("/");
}
