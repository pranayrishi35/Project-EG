"use client";

import { useState, useTransition } from "react";
import { logMockTest, deleteMockTest } from "@/app/actions/logMockTest";
import type { MockTestResult } from "@/app/actions/logMockTest";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface MockTestAnalyzerProps {
  planId: string;
  initialTests: MockTestResult[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function barColor(accuracy: number): string {
  if (accuracy >= 80) return "linear-gradient(180deg, #10B981, #059669)";
  if (accuracy >= 60) return "linear-gradient(180deg, #F59E0B, #D97706)";
  return "linear-gradient(180deg, #F43F5E, #E11D48)";
}

function barTextColor(accuracy: number): string {
  if (accuracy >= 80) return "#059669";
  if (accuracy >= 60) return "#D97706";
  return "#E11D48";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMocks() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)" }}
        aria-hidden="true"
      >
        🎯
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700 mb-0.5">No mock tests logged yet</p>
        <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
          Log your first mock test above to start tracking your score trend and accuracy.
        </p>
      </div>
    </div>
  );
}

// ─── Trend Chart (pure CSS / Tailwind) ────────────────────────────────────────

function TrendChart({ tests }: { tests: MockTestResult[] }) {
  const latest = tests.slice(-12); // show last 12 at most (scrollable)
  const avgAccuracy = Math.round(
    latest.reduce((a, t) => a + t.accuracy, 0) / latest.length
  );
  const bestScore = Math.max(...latest.map((t) => t.totalScore));
  const trend =
    latest.length >= 2
      ? latest[latest.length - 1].accuracy - latest[0].accuracy
      : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "Avg Accuracy", value: `${avgAccuracy}%`, color: "#4F46E5" },
          { label: "Best Score", value: bestScore > 0 ? `+${bestScore}` : String(bestScore), color: "#059669" },
          {
            label: "Trend",
            value: trend >= 0 ? `↑ +${Math.round(trend)}%` : `↓ ${Math.round(trend)}%`,
            color: trend >= 0 ? "#059669" : "#E11D48",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="flex-shrink-0 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-center min-w-[90px]"
          >
            <p className="text-xs font-black tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="overflow-x-auto -mx-1">
        <div
          className="flex gap-2 items-end px-1 pb-0"
          style={{ minWidth: `${Math.max(latest.length * 52, 280)}px`, height: "120px" }}
          role="img"
          aria-label={`Mock test accuracy bar chart, ${latest.length} tests`}
        >
          {latest.map((test, i) => {
            const h = Math.max(test.accuracy, 3); // min 3% so bar is always visible
            return (
              <div
                key={test.id}
                className="flex flex-col items-center justify-end gap-1 flex-1"
                style={{ minWidth: "40px", height: "100%" }}
                title={`Test ${i + 1}: ${test.correct}/${test.attempted} correct · Score ${test.totalScore > 0 ? "+" : ""}${test.totalScore}`}
              >
                {/* Score chip above bar */}
                <span
                  className="text-[9px] font-black tabular-nums leading-none mb-0.5"
                  style={{ color: barTextColor(test.accuracy) }}
                >
                  {test.totalScore > 0 ? "+" : ""}{test.totalScore}
                </span>
                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    background: barColor(test.accuracy),
                    minHeight: "4px",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div
          className="flex gap-2 px-1 pt-2 border-t border-gray-100 mt-0"
          style={{ minWidth: `${Math.max(latest.length * 52, 280)}px` }}
        >
          {latest.map((test, i) => (
            <div
              key={test.id}
              className="flex flex-col items-center flex-1"
              style={{ minWidth: "40px" }}
            >
              <span className="text-[9px] font-semibold text-gray-600">
                {Math.round(test.accuracy)}%
              </span>
              <span className="text-[8px] text-gray-300 mt-0.5">{formatDate(test.date)}</span>
              <span className="text-[8px] text-gray-200">T{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Colour legend */}
      <div className="flex items-center gap-4 justify-center pt-1">
        {[
          { color: "#10B981", label: "≥ 80%" },
          { color: "#F59E0B", label: "60–80%" },
          { color: "#F43F5E", label: "< 60%" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Result History Row ───────────────────────────────────────────────────────

function HistoryRow({
  test,
  index,
  onDelete,
  isDeleting,
}: {
  test: MockTestResult;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const accColor =
    test.accuracy >= 80
      ? "text-emerald-600 bg-emerald-50"
      : test.accuracy >= 60
      ? "text-amber-600 bg-amber-50"
      : "text-rose-600 bg-rose-50";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-black text-gray-300 w-5 text-right flex-shrink-0">
        T{index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            {test.correct}/{test.attempted} correct
          </span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${accColor}`}
          >
            {Math.round(test.accuracy)}%
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: test.totalScore >= 0 ? "#059669" : "#E11D48" }}>
            {test.totalScore >= 0 ? "+" : ""}{test.totalScore} pts
          </span>
        </div>
        <p className="text-[10px] text-gray-300 mt-0.5">{formatDate(test.date)} · +{test.marksPerCorrect}/−{test.penaltyPerIncorrect}</p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(test.id)}
        disabled={isDeleting}
        aria-label={`Delete test T${index + 1}`}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-200 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150 active:scale-90 disabled:opacity-40 flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MockTestAnalyzer({
  planId,
  initialTests,
}: MockTestAnalyzerProps) {
  // Form state — only values that CANNOT be derived
  const [attempted, setAttempted] = useState("");
  const [correct, setCorrect] = useState("");
  const [incorrect, setIncorrect] = useState("");
  const [marksPerCorrect, setMarksPerCorrect] = useState("3");
  const [penaltyPerIncorrect, setPenaltyPerIncorrect] = useState("1");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tests, setTests] = useState<MockTestResult[]>(initialTests);

  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Derived calculations (no useState) ─────────────────────────────────────
  const att = Math.max(parseFloat(attempted) || 0, 0);
  const cor = Math.max(parseFloat(correct) || 0, 0);
  const inc = Math.max(parseFloat(incorrect) || 0, 0);
  const mpc = Math.max(parseFloat(marksPerCorrect) || 3, 0.5);
  const pip = Math.max(parseFloat(penaltyPerIncorrect) || 1, 0);

  const totalScore = parseFloat(((cor * mpc) - (inc * pip)).toFixed(2));
  const accuracy = att > 0 ? Math.round((cor / att) * 1000) / 10 : 0;
  const hasInput = att > 0;
  const isInvalid = cor + inc > att;
  const canSubmit = hasInput && !isInvalid && !isSaving;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);

    const result: MockTestResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      attempted: att,
      correct: cor,
      incorrect: inc,
      totalScore,
      accuracy,
      marksPerCorrect: mpc,
      penaltyPerIncorrect: pip,
    };

    // Optimistic
    setTests((prev) => [...prev, result]);

    // Reset form
    setAttempted("");
    setCorrect("");
    setIncorrect("");

    startSaveTransition(async () => {
      try {
        const saved = await logMockTest(planId, result);
        setTests(saved);
      } catch (err) {
        // Revert
        setTests((prev) => prev.filter((t) => t.id !== result.id));
        setSubmitError(err instanceof Error ? err.message : "Failed to save. Try again.");
      }
    });
  }

  function handleDelete(testId: string) {
    if (!confirm("Delete this test result?")) return;
    setDeletingId(testId);
    setTests((prev) => prev.filter((t) => t.id !== testId)); // optimistic

    startDeleteTransition(async () => {
      try {
        const saved = await deleteMockTest(planId, testId);
        setTests(saved);
      } catch {
        // Revert — refetch would be ideal, but keep it simple
        setTests(initialTests);
      } finally {
        setDeletingId(null);
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Log form ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
          Log Mock Test
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Main inputs */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Attempted", value: attempted, set: setAttempted, id: "mock-attempted" },
              { label: "Correct ✓", value: correct, set: setCorrect, id: "mock-correct" },
              { label: "Incorrect ✗", value: incorrect, set: setIncorrect, id: "mock-incorrect" },
            ].map(({ label, value, set, id }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  min="0"
                  step="1"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-800 text-center placeholder-gray-200 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-150"
                />
              </div>
            ))}
          </div>

          {/* Scoring settings */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0 uppercase tracking-wider">Format:</span>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[11px] text-emerald-600 font-bold flex-shrink-0">+</span>
              <input
                id="mock-marks-correct"
                type="number"
                min="0.5"
                step="0.5"
                value={marksPerCorrect}
                onChange={(e) => setMarksPerCorrect(e.target.value)}
                aria-label="Marks per correct answer"
                className="w-12 text-center text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <span className="text-[10px] text-gray-400 flex-shrink-0">correct</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[11px] text-rose-500 font-bold flex-shrink-0">−</span>
              <input
                id="mock-penalty-incorrect"
                type="number"
                min="0"
                step="0.25"
                value={penaltyPerIncorrect}
                onChange={(e) => setPenaltyPerIncorrect(e.target.value)}
                aria-label="Penalty per incorrect answer"
                className="w-12 text-center text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <span className="text-[10px] text-gray-400 flex-shrink-0">wrong</span>
            </div>
          </div>

          {/* Live score preview */}
          {hasInput && (
            <div
              className={[
                "rounded-xl p-3 border transition-all duration-300",
                isInvalid
                  ? "bg-rose-50 border-rose-200"
                  : totalScore >= 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200",
              ].join(" ")}
            >
              {isInvalid ? (
                <p className="text-xs font-semibold text-rose-600 text-center">
                  ⚠️ Correct + Incorrect ({cor + inc}) exceeds Attempted ({att})
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-lg font-black tabular-nums" style={{ color: totalScore >= 0 ? "#059669" : "#E11D48" }}>
                      {totalScore >= 0 ? "+" : ""}{totalScore}
                    </p>
                    <p className="text-[10px] text-gray-400">Score</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                  <div className="text-center flex-1">
                    <p
                      className="text-lg font-black tabular-nums"
                      style={{ color: accuracy >= 80 ? "#059669" : accuracy >= 60 ? "#D97706" : "#E11D48" }}
                    >
                      {accuracy}%
                    </p>
                    <p className="text-[10px] text-gray-400">Accuracy</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                  <div className="text-center flex-1">
                    <p className="text-lg font-black tabular-nums text-gray-700">
                      {att - cor - inc}
                    </p>
                    <p className="text-[10px] text-gray-400">Skipped</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <p className="text-xs text-rose-600 text-center">{submitError}</p>
          )}

          {/* Submit */}
          <button
            id="save-mock-test-btn"
            type="submit"
            disabled={!canSubmit}
            className={[
              "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white",
              "transition-all duration-200 active:scale-[0.98]",
              canSubmit
                ? "hover:opacity-90"
                : "opacity-40 cursor-not-allowed",
            ].join(" ")}
            style={canSubmit ? { background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" } : { background: "#9CA3AF" }}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save Result"
            )}
          </button>
        </form>
      </div>

      {/* ── Trend chart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
            Score Trend
          </p>
          {tests.length > 0 && (
            <span className="text-xs font-bold text-gray-400">
              {tests.length} test{tests.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {tests.length === 0 ? (
          <EmptyMocks />
        ) : (
          <TrendChart tests={tests} />
        )}
      </div>

      {/* ── History list ── */}
      {tests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
            History
          </p>
          <div className="flex flex-col">
            {[...tests].reverse().map((test, i) => (
              <HistoryRow
                key={test.id}
                test={test}
                index={tests.length - 1 - i}
                onDelete={handleDelete}
                isDeleting={isDeleting && deletingId === test.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
