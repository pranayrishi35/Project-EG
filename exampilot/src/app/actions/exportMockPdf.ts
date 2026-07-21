"use server";

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { createClient } from "@/utils/supabase/server";
import { checkIsAdmin } from "@/lib/adminAuth";
import { getAdminClient } from "@/lib/adminClient";
import { EXAM_CONFIGS, type ExamTarget } from "@/lib/examConfig";

/**
 * Server-side PDF export of a full mock test, INCLUDING the answer key.
 *
 * This MUST stay server-side: the PDF embeds correct answers, so generating it
 * in the browser would ship the answer key to the client. The action is
 * admin-gated (only whitelisted admins may download a full paper with answers)
 * and pulls only APPROVED questions, so an unreviewed AI question never lands
 * in a distributed paper.
 *
 * Returns the PDF as a base64 string; the admin UI turns it into a Blob and
 * triggers a download. Base64 keeps this a plain server action (no streaming
 * Response plumbing) which is the simplest reliable transport for a one-shot
 * document.
 */

interface ExportResult {
  success: boolean;
  filename?: string;
  base64?: string;
  count?: number;
  error?: string;
}

// Layout constants (points; US Letter).
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const LINE = 15;
const FONT_SIZE = 11;

interface DrawState {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
}

function newPage(state: DrawState): void {
  state.page = state.doc.addPage([PAGE_W, PAGE_H]);
  state.y = PAGE_H - MARGIN;
}

/** Ensure at least `needed` vertical points remain; page-break otherwise. */
function ensureSpace(state: DrawState, needed: number): void {
  if (state.y - needed < MARGIN) newPage(state);
}

/**
 * Word-wrap `text` to the content width and draw it, advancing y. Sanitizes to
 * WinAnsi-safe characters since the standard PDF fonts can't encode arbitrary
 * unicode (em-dashes, smart quotes, etc.) and would otherwise throw.
 */
function drawWrapped(
  state: DrawState,
  text: string,
  opts: { font?: PDFFont; size?: number; indent?: number } = {}
): void {
  const font = opts.font ?? state.font;
  const size = opts.size ?? FONT_SIZE;
  const indent = opts.indent ?? 0;
  const maxWidth = PAGE_W - MARGIN * 2 - indent;

  const safe = String(text ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    // Drop anything outside the WinAnsi-printable range to avoid encode errors.
    .replace(/[^\x20-\x7E]/g, "");

  const words = safe.split(/\s+/);
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && line) {
      ensureSpace(state, LINE);
      state.page.drawText(line, { x: MARGIN + indent, y: state.y, size, font, color: rgb(0.1, 0.1, 0.1) });
      state.y -= LINE;
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) {
    ensureSpace(state, LINE);
    state.page.drawText(line, { x: MARGIN + indent, y: state.y, size, font, color: rgb(0.1, 0.1, 0.1) });
    state.y -= LINE;
  }
}

export async function exportMockPdf(examTarget: string): Promise<ExportResult> {
  // ── Admin gate ────────────────────────────────────────────────────────────
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !(await checkIsAdmin(user.email))) {
    return { success: false, error: "Unauthorized" };
  }

  const config = EXAM_CONFIGS[examTarget as ExamTarget];
  if (!config) return { success: false, error: `Unknown exam target: ${examTarget}` };

  // ── Pull APPROVED mock questions only ──────────────────────────────────────
  const admin = getAdminClient();
  const { data: questions, error: qErr } = await admin
    .from("question_bank")
    .select("question, options, correct_index, subject")
    .eq("exam_target", examTarget)
    .eq("source_pool", "mock")
    .eq("review_status", "approved")
    .neq("subject", "Current Affairs")
    .limit(config.total_questions);

  if (qErr) return { success: false, error: `DB error: ${qErr.message}` };
  if (!questions || questions.length === 0) {
    return { success: false, error: `No approved questions available for ${examTarget}.` };
  }

  // ── Build the document ─────────────────────────────────────────────────────
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const state: DrawState = { doc, page: doc.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN, font, bold };

  // Title block
  drawWrapped(state, `ExamPilot — ${examTarget} Full Mock Test`, { font: bold, size: 18 });
  state.y -= 4;
  drawWrapped(state, `${questions.length} questions  •  ${config.marks_per_correct} marks each  •  ${config.negative_marking} negative  •  ${Math.round(config.duration_seconds / 60)} min`, { size: 10 });
  state.y -= 10;

  // Questions
  questions.forEach((q, idx) => {
    ensureSpace(state, LINE * 3);
    drawWrapped(state, `Q${idx + 1}. ${q.question}`, { font: bold });
    const opts = Array.isArray(q.options) ? q.options : [];
    opts.forEach((opt: string, oi: number) => {
      const label = String.fromCharCode(65 + oi); // A, B, C, D
      drawWrapped(state, `${label}. ${opt}`, { indent: 16 });
    });
    state.y -= 8;
  });

  // Answer key on a fresh page
  newPage(state);
  drawWrapped(state, "Answer Key", { font: bold, size: 16 });
  state.y -= 6;
  questions.forEach((q, idx) => {
    const ci = typeof q.correct_index === "number" ? q.correct_index : 0;
    const letter = String.fromCharCode(65 + ci);
    drawWrapped(state, `Q${idx + 1}: ${letter}`, { size: 10 });
  });

  const bytes = await doc.save();
  const base64 = Buffer.from(bytes).toString("base64");
  const stamp = examTarget.toLowerCase();

  return {
    success: true,
    filename: `exampilot-${stamp}-full-mock.pdf`,
    base64,
    count: questions.length,
  };
}
