"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function deleteAccount() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to delete your account." };
    }

    // Set the user profile to deleted and schedule deletion.
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 48);

    // is_deleted / deletion_deadline are REVOKEd from the client-facing role (they
    // gate the account lifecycle), so the write MUST go through the service role.
    // Ownership is still enforced server-side via the authenticated session above.
    const admin = getAdminClient();
    const { data: updated, error } = await admin
      .from("user_profiles")
      .update({
        is_deleted: true,
        deletion_deadline: deadline.toISOString(),
      })
      .eq("user_id", user.id)
      .select("user_id");

    if (error) {
      console.error("Failed to mark account for deletion:", error);
      return { success: false, error: "Failed to delete account" };
    }

    if (!updated || updated.length !== 1) {
      console.error("Account deletion affected an unexpected number of rows:", updated?.length ?? 0);
      return { success: false, error: "Failed to delete account" };
    }

    // Sign out the user
    await supabase.auth.signOut();

    // Set a short-lived cookie for the success banner
    cookies().set("account_deleted", "true", { maxAge: 30, path: "/", httpOnly: false });

  } catch (err) {
    console.error("Unexpected error during account deletion:", err);
    return { success: false, error: "An unexpected error occurred" };
  }

  // Redirect to login page outside of try/catch to prevent NEXT_REDIRECT from being caught
  redirect("/login");
}
