"use server";

import { getAdminClient } from "@/lib/adminClient";
import { checkIsAdmin } from "@/lib/adminAuth";
import { createClient } from "@/utils/supabase/server";

/**
 * Internal helper to verify if the caller is an admin
 */
async function verifyAdminCaller() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");
  
  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    throw new Error("Access Denied: You do not have admin privileges.");
  }
}

export async function fetchRecentUsers() {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();
    
    // Fetch users from Auth (most secure way to get accurate emails)
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      perPage: 50
    });
    
    if (authError) throw authError;

    // Fetch credits from user_profiles
    const { data: profiles, error: profError } = await admin
      .from("user_profiles")
      .select("user_id, credits")
      .in("user_id", authData.users.map(u => u.id));
      
    if (profError) throw profError;

    // Fetch name and email from profiles
    const { data: standardProfiles, error: stdProfError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authData.users.map(u => u.id));

    if (stdProfError) throw stdProfError;

    const mappedUsers = authData.users.map(u => {
      const uprof = profiles?.find(p => p.user_id === u.id);
      const sprof = standardProfiles?.find(p => p.id === u.id);
      
      return {
        id: u.id,
        email: u.email || sprof?.email || "No Email",
        name: (uprof as any)?.full_name || sprof?.full_name || "Unknown",
        joinDate: u.created_at,
        credits: uprof?.credits || 0,
        lastSignIn: u.last_sign_in_at
      };
    }).sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

    return { success: true, data: mappedUsers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchQuestions(examTarget: string, subject: string) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();
    
    let query = admin
      .from("question_bank")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (examTarget) {
      query = query.eq("exam_target", examTarget);
    }
    if (subject) {
      query = query.eq("subject", subject);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();
    
    const { error } = await admin
      .from("question_bank")
      .delete()
      .eq("id", questionId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addManualQuestion(payload: {
  exam_target: string;
  subject: string;
  question: string;
  options: string[];
  correct_index: number;
  is_pyq: boolean;
  pyq_year?: string;
}) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();
    
    const { error } = await admin
      .from("question_bank")
      .insert({
        exam_target: payload.exam_target,
        subject: payload.subject,
        question: payload.question,
        options: payload.options,
        correct_index: payload.correct_index,
        is_pyq: payload.is_pyq,
        pyq_year: payload.pyq_year || null,
        source_pool: 'booklet',
        explanation: 'Manually added by Admin',
        // Human-authored → trusted, goes live immediately (unlike AI-generated
        // questions which land as 'pending' for review).
        review_status: 'approved'
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── AI Question Review Queue ───────────────────────────────────────────────
// AI-generated questions (cron + admin "Generate" buttons) land as
// review_status='pending' and are invisible to live tests until an admin
// approves them here. This is the uniform human gate over all machine output.

/** Counts of pending AI questions grouped by exam_target (review dashboard). */
export async function getPendingReviewSummary() {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();

    const { data, error } = await admin
      .from("question_bank")
      .select("exam_target")
      .eq("review_status", "pending");

    if (error) throw error;

    const byExam: Record<string, number> = {};
    for (const row of data || []) {
      const key = (row as any).exam_target || "Unknown";
      byExam[key] = (byExam[key] || 0) + 1;
    }
    return { success: true, total: (data || []).length, byExam };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Fetches a page of pending questions for review, optionally filtered by exam. */
export async function fetchPendingQuestions(examTarget?: string) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();

    let query = admin
      .from("question_bank")
      .select("*")
      .eq("review_status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (examTarget) query = query.eq("exam_target", examTarget);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Approve specific pending questions (they go live in tests) or all for an exam. */
export async function approveQuestions(opts: { ids?: string[]; examTarget?: string }) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();

    let query = admin
      .from("question_bank")
      .update({ review_status: "approved" })
      .eq("review_status", "pending");

    if (opts.ids && opts.ids.length > 0) {
      query = query.in("id", opts.ids);
    } else if (opts.examTarget) {
      query = query.eq("exam_target", opts.examTarget);
    } else {
      return { success: false, error: "Provide ids or examTarget to approve." };
    }

    const { data, error } = await query.select("id");
    if (error) throw error;
    return { success: true, count: (data || []).length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Reject (delete) pending questions — by ids, or all pending for an exam. */
export async function rejectQuestions(opts: { ids?: string[]; examTarget?: string }) {
  try {
    await verifyAdminCaller();
    const admin = getAdminClient();

    // Only ever deletes rows still pending — never touches approved/live questions.
    let query = admin
      .from("question_bank")
      .delete()
      .eq("review_status", "pending");

    if (opts.ids && opts.ids.length > 0) {
      query = query.in("id", opts.ids);
    } else if (opts.examTarget) {
      query = query.eq("exam_target", opts.examTarget);
    } else {
      return { success: false, error: "Provide ids or examTarget to reject." };
    }

    const { data, error } = await query.select("id");
    if (error) throw error;
    return { success: true, count: (data || []).length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
