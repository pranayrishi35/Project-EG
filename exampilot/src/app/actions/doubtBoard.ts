"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/adminClient";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkAiRateLimit } from "@/lib/aiRateLimit";
import { moderateContent } from "@/lib/contentModeration";
import { sanitizePrompt } from "@/lib/sanitizer";
import { isGuestUser } from "@/lib/guestShield";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ExamTrack = "AFCAT" | "NDA" | "CDS";

export interface DoubtPostSummary {
  id: string;
  examTrack: ExamTrack;
  topic: string | null;
  title: string;
  body: string;
  authorHandle: string;
  isOwnPost: boolean;
  hasAiDraft: boolean;
  answerCount: number;
  createdAt: string;
}

export interface DoubtAnswer {
  id: string;
  body: string;
  authorHandle: string;
  isOwnAnswer: boolean;
  createdAt: string;
}

export interface DoubtPostDetail extends DoubtPostSummary {
  aiDraft: string | null;
  answers: DoubtAnswer[];
}

type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Resolve a public display handle for a user_id, falling back to a masked id. */
function fallbackHandle(userId: string): string {
  return `aspirant_${userId.slice(0, 6)}`;
}

/**
 * Tejas AI draft — best-effort suggested answer generated on post creation.
 * NEVER throws (caller treats a null return as "no draft yet"). Not charged to
 * the user's credits (it's an automatic value-add), but the caller gates it
 * behind the AI rate limit to protect provider quota.
 */
async function generateTejasDraft(
  examTrack: ExamTrack,
  title: string,
  body: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    // White-Label AI Protocol — identity must never leak.
    const system = `You are Tejas, Jishnu's proprietary AI study wingman for Indian defense exam aspirants (AFCAT, CDS, NDA).
Under NO circumstances mention Google, Gemini, OpenAI, or that you are a large language model. If asked what you are, say only: "I'm Tejas, Jishnu's proprietary AI study wingman."
A student has posted a doubt on the public ${examTrack} Q&A board. Draft a clear, correct, encouraging answer.
Rules:
- Be accurate and specific to the ${examTrack} exam. If the question is ambiguous, answer the most likely interpretation and note the assumption.
- Keep it concise (under 200 words), use simple language, and structure with short paragraphs or bullets where helpful.
- If you are not confident the answer is correct, say so plainly rather than inventing facts.
- Never include profanity, personal contact details, or anything unsafe.
- Do not restate the question; go straight to the helpful answer.`;

    const prompt = `Question title: ${sanitizePrompt(title)}\n\nDetails: ${sanitizePrompt(body)}`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system,
      prompt,
      temperature: 0.5,
      maxOutputTokens: 500,
    });

    const trimmed = (text ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (err) {
    // White-Label Protocol: log server-side only, never surface provider errors.
    console.error("[doubtBoard] Tejas draft generation failed:", err);
    return null;
  }
}

// ─── Username (public handle) ──────────────────────────────────────────────────

/**
 * Set the caller's public handle. Set-once: if a username already exists it is
 * NOT overwritten (prevents impersonation churn). Enforced server-side.
 */
export async function setUsername(raw: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "You must be signed in." };

  const username = (raw ?? "").trim();
  if (!USERNAME_RE.test(username)) {
    return {
      success: false,
      error: "Username must be 3–20 characters, letters, numbers, or underscores only.",
    };
  }

  // Reject if it trips the profanity filter.
  const mod = moderateContent(username);
  if (!mod.ok) {
    return { success: false, error: "That username isn't allowed. Please choose another." };
  }

  // Set-once guard.
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.username) {
    return { success: false, error: "You've already set your username." };
  }

  const admin = getAdminClient();
  const { error: updateError, data: updatedData } = await admin
    .from("user_profiles")
    .upsert({ user_id: user.id, username }, { onConflict: "user_id" })
    .select();

  if (updateError) {
    // Unique-violation → handle taken.
    if (updateError.code === "23505") {
      return { success: false, error: "That username is already taken." };
    }
    console.error("[doubtBoard] setUsername failed:", updateError);
    return { success: false, error: "Couldn't save your username. Please try again." };
  }

  if (!updatedData || updatedData.length === 0) {
    console.error("[doubtBoard] setUsername failed: no profile found for user", user.id);
    return { success: false, error: "Profile not found. Please contact support." };
  }

  return { success: true };
}

/** Fetch the caller's current handle (null if not yet set). */
export async function getMyHandle(): Promise<{ username: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { username: null };
  const { data } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  return { username: data?.username ?? null };
}

// ─── Create a doubt post ────────────────────────────────────────────────────────

export async function createDoubtPost(input: {
  examTrack: ExamTrack;
  topic?: string;
  title: string;
  body: string;
}): Promise<ActionResult<{ postId: string }>> {
  if (isGuestUser()) {
    return { success: false, error: "Please sign in to post on the doubt board." };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "You must be signed in." };

  // ── Validate ──
  const validTracks: ExamTrack[] = ["AFCAT", "NDA", "CDS"];
  if (!validTracks.includes(input.examTrack)) {
    return { success: false, error: "Please choose a valid exam track." };
  }
  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();
  const topic = (input.topic ?? "").trim() || null;
  if (title.length < 10 || title.length > 200) {
    return { success: false, error: "Your question title should be 10–200 characters." };
  }
  if (body.length < 20 || body.length > 5000) {
    return { success: false, error: "Please add a bit more detail (20–5000 characters)." };
  }

  // ── Moderate (title + body + topic) ──
  for (const field of [title, body, topic ?? ""]) {
    const mod = moderateContent(field || "ok");
    if (!mod.ok) {
      console.warn("[doubtBoard] post blocked by moderation:", mod.matches);
      return { success: false, error: mod.reason ?? "Content not allowed." };
    }
  }

  // ── Rate limit: 5 posts / 5 min (anti-flood, mirrors auth-endpoint discipline) ──
  const rl = await checkRateLimit(user.id, "createDoubtPost", 5, 300);
  if (!rl.success) {
    return {
      success: false,
      error: "You're posting too quickly. Please wait a few minutes and try again.",
    };
  }

  // 🛡️ Require a public handle (set-once, non-legal-name) 🛡️
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.username) {
    return { success: false, error: "SET_USERNAME_REQUIRED" };
  }

  // 📝 Insert the post 📝
  const { data: inserted, error: insertError } = await admin
    .from("doubt_posts")
    .insert({
      user_id: user.id,
      exam_track: input.examTrack,
      topic,
      title,
      body,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[doubtBoard] post insert failed:", insertError);
    return { success: false, error: "Couldn't publish your question. Please try again." };
  }

  const postId = inserted.id as string;

  // ── Tejas AI draft (best-effort, non-fatal, gated by AI rate limit) ──
  // Written via the service role because clients can't set ai_draft (REVOKE'd).
  const aiRate = await checkAiRateLimit(user.id);
  if (aiRate.success) {
    const draft = await generateTejasDraft(input.examTrack, title, body);
    if (draft) {
      try {
        const admin = getAdminClient();
        await admin
          .from("doubt_posts")
          .update({ ai_draft: draft, ai_drafted_at: new Date().toISOString() })
          .eq("id", postId);
      } catch (err) {
        console.error("[doubtBoard] failed to store AI draft:", err);
        // Non-fatal — the post is already live without a draft.
      }
    }
  }

  return { success: true, data: { postId } };
}

// ─── Answer a doubt ─────────────────────────────────────────────────────────────

export async function createDoubtAnswer(input: {
  postId: string;
  body: string;
}): Promise<ActionResult<{ answerId: string }>> {
  if (isGuestUser()) {
    return { success: false, error: "Please sign in to answer." };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "You must be signed in." };

  const body = (input.body ?? "").trim();
  if (body.length < 10 || body.length > 3000) {
    return { success: false, error: "Your answer should be 10–3000 characters." };
  }

  const mod = moderateContent(body);
  if (!mod.ok) {
    console.warn("[doubtBoard] answer blocked by moderation:", mod.matches);
    return { success: false, error: mod.reason ?? "Content not allowed." };
  }

  const rl = await checkRateLimit(user.id, "createDoubtAnswer", 10, 300);
  if (!rl.success) {
    return { success: false, error: "You're answering too quickly. Please slow down a little." };
  }

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.username) {
    return { success: false, error: "SET_USERNAME_REQUIRED" };
  }

  const { data: inserted, error: insertError } = await admin
    .from("doubt_answers")
    .insert({ post_id: input.postId, user_id: user.id, body })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[doubtBoard] answer insert failed:", insertError);
    return { success: false, error: "Couldn't post your answer. Please try again." };
  }

  return { success: true, data: { answerId: inserted.id as string } };
}

// ─── Report content (→ admin moderation queue) ──────────────────────────────────

export async function reportContent(input: {
  postId?: string;
  answerId?: string;
  reason: "spam" | "abuse" | "inappropriate" | "other";
  details?: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "You must be signed in to report." };

  const hasPost = !!input.postId;
  const hasAnswer = !!input.answerId;
  if (hasPost === hasAnswer) {
    return { success: false, error: "Report must target exactly one item." };
  }
  const validReasons = ["spam", "abuse", "inappropriate", "other"];
  if (!validReasons.includes(input.reason)) {
    return { success: false, error: "Please choose a valid report reason." };
  }
  const details = (input.details ?? "").trim().slice(0, 500) || null;

  // Rate limit reports too (prevent report-spam as its own abuse vector).
  const rl = await checkRateLimit(user.id, "reportContent", 20, 300);
  if (!rl.success) {
    return { success: false, error: "Too many reports in a short time. Please wait a moment." };
  }

  const { error: insertError } = await supabase.from("doubt_reports").insert({
    reporter_user_id: user.id,
    reported_post_id: input.postId ?? null,
    reported_answer_id: input.answerId ?? null,
    reason: input.reason,
    details,
  });

  if (insertError) {
    console.error("[doubtBoard] report insert failed:", insertError);
    return { success: false, error: "Couldn't submit your report. Please try again." };
  }

  return { success: true };
}

// ─── Read: list posts for an exam track ─────────────────────────────────────────

export async function getDoubtPosts(
  examTrack: ExamTrack
): Promise<ActionResult<DoubtPostSummary[]>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts, error } = await supabase
    .from("doubt_posts")
    .select("id, user_id, exam_track, topic, title, body, ai_draft, created_at")
    .eq("exam_track", examTrack)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[doubtBoard] getDoubtPosts failed:", error);
    return { success: false, error: "Couldn't load the doubt board. Please try again." };
  }

  const rows = posts ?? [];

  // Resolve author handles + answer counts. RLS already filtered to approved,
  // non-hidden rows.
  const authorIds = Array.from(new Set(rows.map((p) => p.user_id)));
  const handleMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, username")
      .in("user_id", authorIds);
    for (const pr of profiles ?? []) {
      handleMap.set(pr.user_id, pr.username ?? fallbackHandle(pr.user_id));
    }
  }

  const postIds = rows.map((p) => p.id);
  const countMap = new Map<string, number>();
  if (postIds.length > 0) {
    const { data: answers } = await supabase
      .from("doubt_answers")
      .select("post_id")
      .in("post_id", postIds);
    for (const a of answers ?? []) {
      countMap.set(a.post_id, (countMap.get(a.post_id) ?? 0) + 1);
    }
  }

  const summaries: DoubtPostSummary[] = rows.map((p) => ({
    id: p.id,
    examTrack: p.exam_track as ExamTrack,
    topic: p.topic,
    title: p.title,
    body: p.body,
    authorHandle: handleMap.get(p.user_id) ?? fallbackHandle(p.user_id),
    isOwnPost: user?.id === p.user_id,
    hasAiDraft: !!p.ai_draft,
    answerCount: countMap.get(p.id) ?? 0,
    createdAt: p.created_at,
  }));

  return { success: true, data: summaries };
}

// ─── Read: a single post with its answers ────────────────────────────────────────

export async function getDoubtPost(
  postId: string
): Promise<ActionResult<DoubtPostDetail>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("doubt_posts")
    .select("id, user_id, exam_track, topic, title, body, ai_draft, created_at")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    console.error("[doubtBoard] getDoubtPost failed:", error);
    return { success: false, error: "Couldn't load this question." };
  }
  if (!post) {
    return { success: false, error: "This question isn't available." };
  }

  const { data: answers } = await supabase
    .from("doubt_answers")
    .select("id, user_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);

  const authorIds = Array.from(
    new Set([post.user_id, ...(answers ?? []).map((a) => a.user_id)])
  );
  const handleMap = new Map<string, string>();
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, username")
    .in("user_id", authorIds);
  for (const pr of profiles ?? []) {
    handleMap.set(pr.user_id, pr.username ?? fallbackHandle(pr.user_id));
  }

  const detail: DoubtPostDetail = {
    id: post.id,
    examTrack: post.exam_track as ExamTrack,
    topic: post.topic,
    title: post.title,
    body: post.body,
    authorHandle: handleMap.get(post.user_id) ?? fallbackHandle(post.user_id),
    isOwnPost: user?.id === post.user_id,
    hasAiDraft: !!post.ai_draft,
    aiDraft: post.ai_draft ?? null,
    answerCount: (answers ?? []).length,
    createdAt: post.created_at,
    answers: (answers ?? []).map((a) => ({
      id: a.id,
      body: a.body,
      authorHandle: handleMap.get(a.user_id) ?? fallbackHandle(a.user_id),
      isOwnAnswer: user?.id === a.user_id,
      createdAt: a.created_at,
    })),
  };

  return { success: true, data: detail };
}
