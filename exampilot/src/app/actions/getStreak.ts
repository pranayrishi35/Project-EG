"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Calculates and persistently updates the user's current study streak in days.
 *
 * This function checks the `profiles` table for `last_active_date` and `current_streak`.
 * It compares the dates using IST (UTC+5:30) to avoid midnight boundary issues.
 * - If last active was yesterday, streak increments.
 * - If last active was today, streak remains the same.
 * - If last active was > 1 day ago, streak resets to 1.
 * The updated values are then saved back to the database.
 */
export async function getStreak(): Promise<number> {
  const supabase = createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) return 0;

    // Fetch the user's profile to get the current streak state
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_active_date, current_streak")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching profile for streak:", profileError);
      return 0; // Return 0 gracefully on severe DB errors
    }

    // Helper to get IST YYYY-MM-DD
    const getISTDateString = (date: Date) => {
      // IST is UTC + 5:30 (330 minutes)
      const istDate = new Date(date.getTime() + 330 * 60 * 1000);
      return istDate.toISOString().split("T")[0];
    };

    const now = new Date();
    const todayIST = getISTDateString(now);
    
    // Default values if user has no streak data yet
    let currentStreak = profile?.current_streak || 0;
    const lastActiveDateStr = profile?.last_active_date 
      ? getISTDateString(new Date(profile.last_active_date)) 
      : null;

    let newStreak = currentStreak;
    let needsUpdate = false;

    if (!lastActiveDateStr) {
      // First time activity
      newStreak = 1;
      needsUpdate = true;
    } else if (lastActiveDateStr === todayIST) {
      // Already active today, do nothing
      needsUpdate = false;
    } else {
      // Calculate difference in days between todayIST and lastActiveDateStr
      // Since both are YYYY-MM-DD in IST, we can parse them as UTC midnights to get clean day diffs
      const tDate = new Date(`${todayIST}T00:00:00Z`);
      const lDate = new Date(`${lastActiveDateStr}T00:00:00Z`);
      const diffTime = Math.abs(tDate.getTime() - lDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Yesterday! Increment streak
        newStreak = currentStreak + 1;
        needsUpdate = true;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
        needsUpdate = true;
      }
    }

    // Persist the new streak back to the DB if it changed
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          current_streak: newStreak,
          last_active_date: now.toISOString(), // Store actual UTC timestamp in DB
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to update streak:", updateError);
        // Fallback to returning computed streak even if DB save fails
      }
    }

    return newStreak;
  } catch (error) {
    console.error("Streak calculation crashed:", error);
    return 0; // Never crash the page
  }
}
