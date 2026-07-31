// ─────────────────────────────────────────────────────────────────────────────
// ICS (iCalendar / RFC 5545) builder for a user's study plan.
//
// Pure, dependency-free. Given a plan's generated_plan JSONB, its created_at
// anchor, and the exam metadata, it emits a valid VCALENDAR string that any
// calendar app (Google, Apple, Outlook) can subscribe to.
//
// Date model — MUST stay consistent with getTodaysFocus:
//   • Day 1 of the plan is the plan's creation day (IST).
//   • Each subsequent flattened day advances one IST calendar day.
//   • Each study day → one all-day VEVENT on that date.
//   • The exam itself → one all-day VEVENT on exam_date.
//
// All events are all-day (DATE value type) so they render as tidy day banners
// rather than timed blocks, and never shift across the reader's timezone.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExtendedPlan } from "@/app/actions/toggleTopic";

export interface IcsPlanInput {
  /** study_plans.id — used to namespace event UIDs so they're stable per plan. */
  planId: string;
  examName: string;
  /** exam_date as stored (YYYY-MM-DD or ISO). */
  examDate: string;
  /** created_at ISO timestamp — the day-1 anchor. */
  createdAt: string;
  plan: ExtendedPlan;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** IST (UTC+5:30) YYYY-MM-DD for a Date — mirrors getTodaysFocus. */
function toISTDateString(date: Date): string {
  const ist = new Date(date.getTime() + 330 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD. Pure UTC math. */
function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

/** YYYY-MM-DD → YYYYMMDD (the RFC-5545 DATE form). */
function toIcsDate(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

// ── Text escaping (RFC 5545 §3.3.11) ─────────────────────────────────────────

/** Escape a value for a TEXT-typed property (SUMMARY/DESCRIPTION). */
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Fold a content line to <=75 octets per RFC 5545 §3.1. Continuation lines
 * begin with a single space. We fold on character count (a safe proxy here —
 * summaries are short ASCII topic names).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

// ── Flatten plan → ordered days (mirrors getTodaysFocus.flattenDays) ─────────

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

// ── VEVENT builder ───────────────────────────────────────────────────────────

/**
 * All-day event. DTSTART is the date; DTEND is the next day (RFC 5545 treats
 * DTEND as exclusive for DATE values, so a single-day event ends the day after).
 * DTSTAMP is fixed to the plan's createdAt (a deterministic, stable value) so
 * the feed is byte-stable between fetches unless the plan actually changes —
 * important because calendar clients diff on content.
 */
function buildEvent(opts: {
  uid: string;
  dtstamp: string; // YYYYMMDDTHHMMSSZ
  dateISO: string;
  summary: string;
  description?: string;
}): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${opts.dtstamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(opts.dateISO)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDays(opts.dateISO, 1))}`,
    `SUMMARY:${escapeText(opts.summary)}`,
  ];
  if (opts.description) {
    lines.push(`DESCRIPTION:${escapeText(opts.description)}`);
  }
  lines.push("TRANSP:TRANSPARENT"); // study days shouldn't mark you "busy"
  lines.push("END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

/** UTC timestamp form YYYYMMDDTHHMMSSZ from an ISO string. */
function toIcsStamp(iso: string): string {
  const d = new Date(iso);
  const safe = isNaN(d.getTime()) ? new Date(0) : d;
  return safe.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Build the full VCALENDAR string for a plan. Never throws on a malformed plan —
 * a plan with no days yields a valid (empty-of-study-events) calendar that still
 * carries the exam-day event, so a subscribed client degrades gracefully.
 */
export function buildPlanIcs(input: IcsPlanInput): string {
  const { planId, examName, examDate, createdAt, plan } = input;

  const anchorISO = toISTDateString(new Date(createdAt));
  const dtstamp = toIcsStamp(createdAt);
  const flat = flattenDays(plan);

  const events: string[] = [];

  flat.forEach((day, idx) => {
    if (day.topics.length === 0) return; // skip blank days
    const dateISO = addDays(anchorISO, idx);
    const isMock = day.topics.some((t) => t.toLowerCase().includes("mock"));
    const tag = isMock ? "Mock Test" : day.isRevision ? "Revision" : "Study";
    const hours = day.estimatedHours ? ` · ~${day.estimatedHours}h` : "";
    const summary = `${examName} ${tag}: ${day.topics.slice(0, 2).join(", ")}${
      day.topics.length > 2 ? "…" : ""
    }`;
    const description =
      `Day ${idx + 1} — ${tag}${hours}\n` +
      day.topics.map((t) => `• ${t}`).join("\n");
    events.push(
      buildEvent({
        uid: `plan-${planId}-d${idx + 1}@jishnu`,
        dtstamp,
        dateISO,
        summary,
        description,
      })
    );
  });

  // Exam day — an anchor event even when the plan body is empty.
  const examISO = toISTDateString(new Date(examDate));
  events.push(
    buildEvent({
      uid: `plan-${planId}-exam@jishnu`,
      dtstamp,
      dateISO: examISO,
      summary: `🎯 ${examName} Exam Day`,
      description: `Your ${examName} exam. Best of luck — you've prepared for this.`,
    })
  );

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jishnu//Study Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`${examName} Study Plan`)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    ...events,
    "END:VCALENDAR",
  ];

  // RFC 5545 requires CRLF line endings and a trailing CRLF.
  return calendar.join("\r\n") + "\r\n";
}
