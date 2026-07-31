"use server";

import { getAdminClient } from "@/lib/adminClient";
import { checkIsAdmin } from "@/lib/adminAuth";
import { createClient } from "@/utils/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Admin moderation actions for the doubt board (Master Prompt v6, Part 5).
//
// All writes go through the service-role client (moderation columns are REVOKE'd
// from the browser), gated by verifyAdminCaller(). This is the "actual admin
// review path" the spec requires — reports land in a queue an admin resolves,
// and admins can hide/reject offending content.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the caller's user id after asserting admin, or throws. */
async function requireAdmin(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");
  if (!(await checkIsAdmin(user.email))) {
    throw new Error("Access Denied: You do not have admin privileges.");
  }
  return user.id;
}

export interface ModerationReport {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporterHandle: string;
  target: {
    kind: "post" | "answer";
    id: string;
    title: string | null; // post title, or parent post title for an answer
    body: string;
    authorHandle: string;
    isHidden: boolean;
    postId: string; // the post to link to (self for a post, parent for an answer)
  } | null;
}

/**
 * Fetch pending reports with their target content resolved, newest first.
 * This is the admin moderation queue.
 */
export async function fetchModerationQueue(): Promise<{
  success: boolean;
  reports?: ModerationReport[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const admin = getAdminClient();

    const { data: reports, error } = await admin
      .from("doubt_reports")
      .select(
        "id, reason, details, created_at, reporter_user_id, reported_post_id, reported_answer_id"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    const rows = reports ?? [];
    if (rows.length === 0) return { success: true, reports: [] };

    // Batch-resolve targets + handles.
    const postIds = rows.map((r) => r.reported_post_id).filter(Boolean) as string[];
    const answerIds = rows.map((r) => r.reported_answer_id).filter(Boolean) as string[];

    const postMap = new Map<
      string,
      { id: string; title: string; body: string; user_id: string; is_hidden: boolean }
    >();
    if (postIds.length) {
      const { data: posts } = await admin
        .from("doubt_posts")
        .select("id, title, body, user_id, is_hidden")
        .in("id", postIds);
      for (const p of posts ?? []) postMap.set(p.id, p);
    }

    const answerMap = new Map<
      string,
      { id: string; body: string; user_id: string; is_hidden: boolean; post_id: string }
    >();
    if (answerIds.length) {
      const { data: answers } = await admin
        .from("doubt_answers")
        .select("id, body, user_id, is_hidden, post_id")
        .in("id", answerIds);
      for (const a of answers ?? []) answerMap.set(a.id, a);
    }

    // Parent post titles for reported answers.
    const parentPostIds = Array.from(answerMap.values()).map((a) => a.post_id);
    if (parentPostIds.length) {
      const missing = parentPostIds.filter((id) => !postMap.has(id));
      if (missing.length) {
        const { data: parents } = await admin
          .from("doubt_posts")
          .select("id, title, body, user_id, is_hidden")
          .in("id", missing);
        for (const p of parents ?? []) postMap.set(p.id, p);
      }
    }

    // Resolve handles for reporters + content authors.
    const userIds = new Set<string>();
    rows.forEach((r) => userIds.add(r.reporter_user_id));
    postMap.forEach((p) => userIds.add(p.user_id));
    answerMap.forEach((a) => userIds.add(a.user_id));

    const handleMap = new Map<string, string>();
    if (userIds.size) {
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("user_id, username")
        .in("user_id", Array.from(userIds));
      for (const pr of profiles ?? []) {
        handleMap.set(pr.user_id, pr.username ?? `aspirant_${pr.user_id.slice(0, 6)}`);
      }
    }
    const handleOf = (id: string) => handleMap.get(id) ?? `aspirant_${id.slice(0, 6)}`;

    const result: ModerationReport[] = rows.map((r) => {
      let target: ModerationReport["target"] = null;
      if (r.reported_post_id) {
        const p = postMap.get(r.reported_post_id);
        if (p) {
          target = {
            kind: "post",
            id: p.id,
            title: p.title,
            body: p.body,
            authorHandle: handleOf(p.user_id),
            isHidden: p.is_hidden,
            postId: p.id,
          };
        }
      } else if (r.reported_answer_id) {
        const a = answerMap.get(r.reported_answer_id);
        if (a) {
          const parent = postMap.get(a.post_id);
          target = {
            kind: "answer",
            id: a.id,
            title: parent?.title ?? null,
            body: a.body,
            authorHandle: handleOf(a.user_id),
            isHidden: a.is_hidden,
            postId: a.post_id,
          };
        }
      }
      return {
        id: r.id,
        reason: r.reason,
        details: r.details,
        createdAt: r.created_at,
        reporterHandle: handleOf(r.reporter_user_id),
        target,
      };
    });

    return { success: true, reports: result };
  } catch (err) {
    console.error("[doubtModeration] fetchModerationQueue failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to load moderation queue.";
    return { success: false, error: msg };
  }
}

/** Count of pending reports (for the admin tab badge). */
export async function getModerationQueueCount(): Promise<{ count: number }> {
  try {
    await requireAdmin();
    const admin = getAdminClient();
    const { count } = await admin
      .from("doubt_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return { count: count ?? 0 };
  } catch {
    return { count: 0 };
  }
}

/**
 * Resolve a report. action:
 *   • "hide"    → hide the offending content AND mark the report reviewed.
 *   • "dismiss" → leave content visible, mark the report dismissed (false alarm).
 */
export async function resolveReport(input: {
  reportId: string;
  action: "hide" | "dismiss";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUserId = await requireAdmin();
    const admin = getAdminClient();

    const { data: report, error: fetchErr } = await admin
      .from("doubt_reports")
      .select("id, reported_post_id, reported_answer_id, status")
      .eq("id", input.reportId)
      .maybeSingle();

    if (fetchErr || !report) {
      return { success: false, error: "Report not found." };
    }

    // Hide the content if requested.
    if (input.action === "hide") {
      if (report.reported_post_id) {
        await admin
          .from("doubt_posts")
          .update({ is_hidden: true, status: "rejected" })
          .eq("id", report.reported_post_id);
      } else if (report.reported_answer_id) {
        await admin
          .from("doubt_answers")
          .update({ is_hidden: true, status: "rejected" })
          .eq("id", report.reported_answer_id);
      }
    }

    const { error: updateErr } = await admin
      .from("doubt_reports")
      .update({
        status: input.action === "hide" ? "reviewed" : "dismissed",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.reportId);

    if (updateErr) {
      console.error("[doubtModeration] resolveReport update failed:", updateErr);
      return { success: false, error: "Couldn't update the report." };
    }

    return { success: true };
  } catch (err) {
    console.error("[doubtModeration] resolveReport failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to resolve report.";
    return { success: false, error: msg };
  }
}

/** Restore previously hidden content (admin reversal). */
export async function restoreContent(input: {
  kind: "post" | "answer";
  id: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const admin = getAdminClient();
    const table = input.kind === "post" ? "doubt_posts" : "doubt_answers";
    const { error } = await admin
      .from(table)
      .update({ is_hidden: false, status: "approved" })
      .eq("id", input.id);
    if (error) {
      return { success: false, error: "Couldn't restore the content." };
    }
    return { success: true };
  } catch (err) {
    console.error("[doubtModeration] restoreContent failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to restore content.";
    return { success: false, error: msg };
  }
}
