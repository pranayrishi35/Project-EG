"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Calculates the user's current study streak in days.
 *
 * Definition: the number of consecutive calendar days (going backwards
 * from today, with a 1-day grace period) on which the user created at
 * least one study plan. This is computable from existing data with no
 * schema changes.
 *
 * Grace period: if the user hasn't created a plan today yet, we start
 * the count from yesterday so the streak doesn't reset at midnight.
 */
export async function getStreak(): Promise<number> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    // Fetch all plan creation dates for this user
    const { data, error } = await supabase
      .from("study_plans")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(365);

    if (error || !data || data.length === 0) return 0;

    // Build a Set of unique YYYY-MM-DD strings (UTC date of each plan)
    const activeDates = new Set<string>(
      data.map((r) => new Date(r.created_at).toISOString().split("T")[0])
    );

    // Normalise today to midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If neither today nor yesterday has activity, streak is 0
    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      return 0;
    }

    // Start counting from the most recent active day (today if active,
    // else yesterday — the grace-period day)
    const startDate = activeDates.has(todayStr) ? today : yesterday;

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().split("T")[0];

      if (activeDates.has(key)) {
        streak++;
      } else {
        break; // Chain broken
      }
    }

    return streak;
  } catch {
    // Never crash the page if streak calculation fails
    return 0;
  }
}
