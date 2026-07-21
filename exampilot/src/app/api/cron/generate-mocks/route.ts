import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { SUPPORTED_EXAMS, generateFullMockRows } from "@/lib/mockGenerator";

// Runs dynamically; extend timeout to the max Vercel Hobby allows since a full
// mock generation makes several sequential Gemini calls.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cost control. The cron only tops up an exam whose APPROVED mock pool has
// fallen below this floor, and it refills at most one exam per run so a single
// invocation never fans out into many Gemini calls. With an every-2-days
// schedule this drip-feeds the bank instead of regenerating everything.
const APPROVED_FLOOR = 120; // ~one full mock's worth of live questions
const MAX_PENDING_BACKLOG = 300; // don't pile up unreviewed questions

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
  }
  const supabase = createSupabaseClient(url, key);

  try {
    // 1. Find the exam most in need of a top-up: lowest approved mock pool that
    //    is below the floor. Checking approved (not total) means an exam with a
    //    big pending backlog still counts as "needs review, not generation".
    let target: string | null = null;
    let lowest = Infinity;
    const report: Record<string, { approved: number; pending: number }> = {};

    for (const exam of SUPPORTED_EXAMS) {
      const [{ count: approved }, { count: pending }] = await Promise.all([
        supabase
          .from("question_bank")
          .select("*", { count: "exact", head: true })
          .eq("exam_target", exam)
          .eq("source_pool", "mock")
          .eq("review_status", "approved"),
        supabase
          .from("question_bank")
          .select("*", { count: "exact", head: true })
          .eq("exam_target", exam)
          .eq("source_pool", "mock")
          .eq("review_status", "pending"),
      ]);

      const approvedCount = approved ?? 0;
      const pendingCount = pending ?? 0;
      report[exam] = { approved: approvedCount, pending: pendingCount };

      // Skip exams already stocked, or with too much unreviewed backlog.
      if (approvedCount >= APPROVED_FLOOR) continue;
      if (pendingCount >= MAX_PENDING_BACKLOG) continue;

      if (approvedCount < lowest) {
        lowest = approvedCount;
        target = exam;
      }
    }

    if (!target) {
      return NextResponse.json({
        success: true,
        generated: 0,
        message: "All exams sufficiently stocked or backlogged; nothing generated.",
        report,
      });
    }

    // 2. Generate one full mock for the neediest exam, into pending review.
    const rows = await generateFullMockRows(target);
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Generation produced no questions for ${target}`, report },
        { status: 502 }
      );
    }

    const { error: dbError } = await supabase.from("question_bank").insert(rows);
    if (dbError) {
      return NextResponse.json(
        { success: false, error: `DB insert failed: ${dbError.message}`, report },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exam: target,
      generated: rows.length,
      status: "pending_review",
      report,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[cron/generate-mocks] error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
