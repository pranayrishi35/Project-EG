import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPlanIcs } from "@/lib/icsBuilder";
import type { ExtendedPlan } from "@/app/actions/toggleTopic";

// This feed is fetched by calendar apps (Google/Apple/Outlook) on their own
// polling schedule, from their own servers — there is no user session. Auth is
// the unguessable token in the path (122-bit UUID), the same bearer-URL model
// as Google's "secret address in iCal format". We read with the service role
// because the reader is unauthenticated, and scope every query by the token.
//
// Runtime: nodejs (service-role key must never reach the edge/client bundle).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Best-effort client IP for rate-limiting. */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}

/**
 * Fixed-window IP rate limit via Vercel KV REST (Edge-safe fetch, no SDK).
 * Public unauthenticated endpoint, so we cap by IP: 30 requests / 5 min. Fails
 * OPEN if KV is unconfigured or unreachable — a calendar feed must not 500 just
 * because the limiter is down.
 */
async function rateLimited(ip: string): Promise<boolean> {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return false; // fail open

  try {
    const windowKey = `ratelimit_ics_${ip}_${Math.floor(Date.now() / 300000)}`;
    const res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", windowKey],
        ["EXPIRE", windowKey, 300],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return false; // fail open
    const data = await res.json();
    const count = Array.isArray(data) ? Number(data[0]?.result ?? 0) : 0;
    return count > 30;
  } catch {
    return false; // fail open
  }
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  // The subscribe URL ends in `.ics` for client compatibility; strip it to get
  // the raw token. Anything else is rejected before touching the DB.
  const raw = params.token.replace(/\.ics$/i, "");
  if (!UUID_RE.test(raw)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ip = clientIp(request);
  if (await rateLimited(ip)) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": "300" },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[calendar.ics] Supabase service credentials missing");
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve the token → user. Generic 404 on miss (never reveal token validity
  // vs. existence differently).
  const { data: profile, error: profileErr } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("calendar_token", raw)
    .maybeSingle();

  if (profileErr || !profile) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Most-recent plan = the active track (same rule as getTodaysFocus).
  const { data: plan, error: planErr } = await admin
    .from("study_plans")
    .select("id, exam_name, exam_date, generated_plan, created_at")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let ics: string;
  if (planErr) {
    console.error("[calendar.ics] plan query failed:", planErr);
    return new NextResponse("Service unavailable", { status: 503 });
  }

  if (!plan) {
    // Valid token, no plan yet — return an empty but valid calendar so the
    // subscription stays healthy and auto-fills once a plan is created.
    ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jishnu//Study Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Jishnu Study Plan",
      "X-WR-TIMEZONE:Asia/Kolkata",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
  } else {
    ics = buildPlanIcs({
      planId: plan.id,
      examName: plan.exam_name,
      examDate: plan.exam_date,
      createdAt: plan.created_at,
      plan: (plan.generated_plan ?? { weeks: [] }) as ExtendedPlan,
    });
  }

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="jishnu-study-plan.ics"',
      // Let clients cache briefly; they poll far more often than plans change.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
