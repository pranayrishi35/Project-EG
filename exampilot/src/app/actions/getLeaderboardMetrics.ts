"use server";

import { createClient } from "@/utils/supabase/server";

export async function getLeaderboardMetrics(examTarget: string, testNumber: number, score: number) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_instant_rank', {
      p_exam_target: examTarget,
      p_test_number: testNumber,
      p_score: score
    });

    if (error) {
      console.error("Leaderboard RPC Error:", error);
      return { success: false, error: "Failed to fetch leaderboard." };
    }

    if (data && data.length > 0) {
      return { 
        success: true, 
        rank: data[0].calculated_rank, 
        percentile: data[0].percentile 
      };
    }
    
    return { success: false, error: "No rank data returned." };
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return { success: false, error: "Internal server error" };
  }
}
