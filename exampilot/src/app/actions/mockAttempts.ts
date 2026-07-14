"use server";

import { createClient } from "@/utils/supabase/server";

export async function saveMockProgress(payload: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { id, exam_target, test_number, status, score, time_remaining, answers_state } = payload;
  
  let currentTestNumber = test_number;

  // Phase 1: Calculate test_number if missing
  if (currentTestNumber === undefined || currentTestNumber === null) {
    // Check if attempt already exists to prevent overwriting test_number
    const { data: existing } = await supabase
      .from('mock_attempts')
      .select('test_number')
      .eq('id', id)
      .single();

    if (existing && existing.test_number) {
      currentTestNumber = existing.test_number;
    } else {
      const { count, error: countError } = await supabase
        .from('mock_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('exam_target', exam_target);
        
      if (countError) {
        console.error("[Mock Sync Count Error]", countError);
      }
      currentTestNumber = (count || 0) + 1;
    }
  }
  
  const { data, error } = await supabase.from('mock_attempts').upsert({
    id,
    user_id: user.id,
    exam_target,
    test_number: currentTestNumber,
    status,
    score,
    time_remaining,
    answers_state,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' }).select().single();

  if (error) {
    console.error("[Mock Sync Error]", error);
    return { success: false, error: error.message, code: error.code };
  }
  return { success: true, data };
}

export async function fetchMockHistory() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase.from('mock_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function fetchMockAttempt(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('mock_attempts').select('*').eq('id', id).single();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data };
}
