"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type CalendarUrlResult =
  | { success: true; url: string; webcalUrl: string }
  | { success: false; error: string };

/**
 * Returns the signed-in user's personal calendar feed URL.
 *
 * The token itself is provisioned at the DB layer (gen_random_uuid() default in
 * migration 002), so this action only READS it — it never writes. RLS scopes the
 * select to the caller's own profile row. We return both an https URL (for the
 * "copy link" affordance) and a webcal:// URL (which makes Apple/Google offer a
 * one-click subscribe instead of a one-time download).
 */
export async function getCalendarUrl(): Promise<CalendarUrlResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in." };
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("calendar_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile?.calendar_token) {
    console.error("[getCalendarUrl] token lookup failed:", error);
    return {
      success: false,
      error: "Your calendar link isn't ready yet. Please try again shortly.",
    };
  }

  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const path = `/api/calendar/${profile.calendar_token}.ics`;

  return {
    success: true,
    url: `${protocol}://${host}${path}`,
    webcalUrl: `webcal://${host}${path}`,
  };
}
