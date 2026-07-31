"use server";

import { createClient } from "@/utils/supabase/server";
import type { ExtendedPlan } from "@/app/actions/toggleTopic";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TodaysFocusTopic {
  /** Stable key matching PlanViewer/toggleTopic: `w{week}d{day}t{index}`. */
  key: string;
  label: string;
  done: boolean;
}

export interface TodaysFocusData {
  planId: string;
  examName: string;
  examDate: string;
  /** 1-based day index into the plan the user is on today. */
  dayNumber: number;
  /** Total study days in the plan (for "Day X of Y"). */
  totalDays: number;
  isRevision: boolean;
  isMock: boolean;
  estimatedHours: number;
  topics: TodaysFocusTopic[];
  /** True when today's date is past the last day of the plan. */
  planComplete: boolean;
}

export type TodaysFocusResult =
  | { status: "ok"; data: TodaysFocusData }
  | { status: "empty" } // signed in, no plan yet
  | { status: "unauthenticated" }
  | { status: "error" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Stable topic key — MUST match PlanViewer.topicKey and toggleTopic. */
function topicKey(weekNum: number, dayNum: number, topicIdx: number): string {
  return `w${weekNum}d${dayNum}t${topicIdx}`;
}

/** IST (UTC+5:30) YYYY-MM-DD — mirrors getStreak's date handling. */
function getISTDateString(date: Date): string {
  const istDate = new Date(date.getTime() + 330 * 60 * 1000);
  return istDate.toISOString().split("T")[0];
}

/** Whole-day difference between two IST date strings (b - a), never negative. */
function daysSince(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`);
  const to = new Date(`${toISO}T00:00:00Z`);
  const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  return Math.max(0, diff);
}

// Flatten the plan's weeks→days into a single ordered list so "today's day"
// maps cleanly onto elapsed days since the plan was created, regardless of how
// the AI chunked weeks. Preserves each day's original week/day numbers so the
// completion keys stay identical to the planner's.
interface FlatDay {
  weekNumber: number;
  dayNumber: number;
  topics: string[];
  estimatedHours: number;
  isRevision: boolean;
}

function flattenDays(plan: ExtendedPlan): FlatDay[] {
  const out: FlatDay[] = [];
  for (const week of plan.weeks ?? []) {
    for (const day of week.days ?? []) {
      out.push({
        weekNumber: week.week_number,
        dayNumber: day.day_number,
        topics: Array.isArray(day.topics) ? day.topics : [],
        estimatedHours: day.estimated_hours ?? 0,
        isRevision: !!day.is_revision,
      });
    }
  }
  return out;
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Resolves the single "here's what to cover today" block for the home surface.
 *
 * "Today" is derived from the plan's created_at: day 1 is the creation day, and
 * each subsequent IST calendar day advances the pointer by one. This is a pure
 * display/extraction feature over the existing generated_plan JSONB — no new
 * columns, no new data model. RLS scopes the query to the caller's own rows.
 */
export async function getTodaysFocus(): Promise<TodaysFocusResult> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { status: "unauthenticated" };

    // Most-recent plan = the user's active track. RLS ensures ownership.
    const { data: plan, error } = await supabase
      .from("study_plans")
      .select("id, exam_name, exam_date, generated_plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[getTodaysFocus] query failed:", error);
      return { status: "error" };
    }
    if (!plan) return { status: "empty" };

    const generated = (plan.generated_plan ?? {}) as ExtendedPlan;
    const flat = flattenDays(generated);
    const totalDays = flat.length;

    if (totalDays === 0) {
      // A malformed/empty plan — treat as no actionable focus rather than crash.
      return { status: "empty" };
    }

    const completed = new Set<string>(generated.completed_topics ?? []);

    // Which day are we on? Elapsed IST days since creation, clamped to the plan.
    const createdISO = getISTDateString(new Date(plan.created_at));
    const todayISO = getISTDateString(new Date());
    const elapsed = daysSince(createdISO, todayISO); // 0 on creation day
    const planComplete = elapsed > totalDays - 1;
    const idx = Math.min(elapsed, totalDays - 1); // clamp to last day
    const today = flat[idx];

    const topics: TodaysFocusTopic[] = today.topics.map((label, i) => {
      const key = topicKey(today.weekNumber, today.dayNumber, i);
      return { key, label, done: completed.has(key) };
    });

    const isMock = today.topics.some((t) => t.toLowerCase().includes("mock"));

    return {
      status: "ok",
      data: {
        planId: plan.id,
        examName: plan.exam_name,
        examDate: plan.exam_date,
        dayNumber: idx + 1, // 1-based for display
        totalDays,
        isRevision: today.isRevision,
        isMock,
        estimatedHours: today.estimatedHours,
        topics,
        planComplete,
      },
    };
  } catch (err) {
    console.error("[getTodaysFocus] unexpected error:", err);
    return { status: "error" };
  }
}
