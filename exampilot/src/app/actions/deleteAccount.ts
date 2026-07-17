"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function deleteAccount() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete your account.");
  }

  // Set the user profile to deleted and schedule deletion
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);

  const { error } = await supabase
    .from("user_profiles")
    .update({
      is_deleted: true,
      deletion_deadline: deadline.toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to mark account for deletion:", error);
    throw new Error("Failed to delete account");
  }

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to login page
  redirect("/login?deleted=true");
}
