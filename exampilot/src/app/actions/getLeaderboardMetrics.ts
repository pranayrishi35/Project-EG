"use server";

import { createClient } from "@/utils/supabase/server";

export async function getLeaderboardMetrics(attemptId: string) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { success: false, error: "Unauthorized" };
  
  try {
    const { data: attempt } = await supabase
      .from('mock_attempts')
      .select('exam_target, test_number, score')
      .eq('id', attemptId)
      .eq('user_id', authData.user.id)
      .single();
      
    if (!attempt) return { success: false, error: "Attempt not found or access denied." };

    const { data, error } = await supabase.rpc('get_instant_rank', {
      p_exam_target: attempt.exam_target,
      p_test_number: attempt.test_number,
      p_score: attempt.score
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
