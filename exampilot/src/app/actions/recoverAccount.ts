"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function recoverAccount() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to recover your account.");
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      is_deleted: false,
      deletion_deadline: null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to recover account:", error);
    throw new Error("Failed to recover account");
  }

  redirect("/dashboard");
}
