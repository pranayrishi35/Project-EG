"use server";

import { createClient } from "@/utils/supabase/server";

export async function getLeaderboardMetrics(attemptId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: "Unauthorized" };
  
  try {
    const { data: attempt } = await supabase
      .from('mock_attempts')
      .select('exam_target, test_number, score, cohort_key')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();
      
    if (!attempt) return { success: false, error: "Attempt not found or access denied." };

    const { data, error } = await supabase.rpc('get_instant_rank', {
      p_exam_target: attempt.exam_target,
      p_test_number: attempt.test_number,
      p_score: attempt.score,
      p_cohort_key: attempt.cohort_key || 'GLOBAL'
    });

    if (error) {
      console.error("Leaderboard RPC Error:", error);
      return { success: false, error: "Failed to fetch leaderboard." };
    }

    if (data && data.length > 0) {
      return { 
        success: true, 
        global_rank: data[0].global_rank, 
        global_percentile: data[0].global_percentile,
        cohort_rank: data[0].cohort_rank,
        cohort_percentile: data[0].cohort_percentile,
        cohort_key: attempt.cohort_key
      };
    }
    
    return { success: false, error: "No rank data returned." };
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return { success: false, error: "Internal server error" };
  }
}
