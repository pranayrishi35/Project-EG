"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { toggleTopic } from "@/app/actions/toggleTopic";
import type { ExtendedPlan } from "@/app/actions/toggleTopic";
import type { PlanWeek, PlanDay } from "@/app/actions/planner";
import type { MockTestResult } from "@/app/actions/logMockTest";
import FocusTimer from "@/components/FocusTimer";
import MockTestAnalyzer from "@/components/MockTestAnalyzer";
import CheatSheetView from "@/components/CheatSheetView";

const MissionClock = dynamic(() => import("@/components/MissionClock"), { ssr: false });
const TestRunner = dynamic(() => import("@/components/TestRunner"), { ssr: false });
import { getMockTest } from "@/app/actions/getMockTest";
import { getMiniTest } from "@/app/actions/getMiniTest";
import type { Question, ScoringMap } from "@/app/actions/getMockTest";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PlanViewerProps {
  planId: string;
  examName: string;
  examDate: string;
  plan: ExtendedPlan;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function topicKey(weekNum: number, dayNum: number, topicIdx: number): string {
  return `w${weekNum}d${dayNum}t${topicIdx}`;
}

function countAll(weeks: PlanWeek[]): number {
  return weeks.reduce(
    (a, w) => a + w.days.reduce((b, d) => b + d.topics.length, 0),
    0
  );
}

function countCompleted(weeks: PlanWeek[], done: Set<string>): number {
  let count = 0;
  for (const w of weeks) {
    for (const d of w.days) {
      for (let i = 0; i < d.topics.length; i++) {
        if (done.has(topicKey(w.week_number, d.day_number, i))) count++;
      }
    }
  }
  return count;
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({
  day,
  weekNum,
  completed,
  justChecked,
  onToggle,
  isPending,
}: {
  day: PlanDay;
  weekNum: number;
  completed: Set<string>;
  justChecked: string | null;
  onToggle: (key: string) => void;
  isPending: boolean;
}) {
  const isRevision = day.is_revision;
  const isMock = day.topics.some((t) => t.toLowerCase().includes("mock"));

  const dayDone = day.topics.every(
    (_, i) => completed.has(topicKey(weekNum, day.day_number, i))
  );

  let borderCls = "border-indigo-100 bg-white";
  let badge: React.ReactNode = null;

  if (dayDone) {
    borderCls = "border-emerald-200 bg-emerald-50/40";
  } else if (isMock) {
    borderCls = "border-amber-200 bg-amber-50/40";
    badge = (
      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        Mock Exam
      </span>
    );
  } else if (isRevision) {
    borderCls = "border-violet-200 bg-violet-50/40";
    badge = (
      <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
        Revision
      </span>
    );
  }

  return (
    <div className={`ep-day-card ${dayDone ? 'ep-done' : ''} rounded-2xl border ${borderCls} p-4 flex flex-col gap-3 transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {dayDone && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0" aria-label="Day complete">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
          <span className="ep-day-label text-xs font-bold text-slate-700 uppercase tracking-wider">
            Day {day.day_number}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <span className="ep-day-hours text-xs text-slate-700 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {day.estimated_hours}h
          </span>
        </div>
      </div>

      {/* Topic checklist */}
      <ul className="flex flex-col gap-2" role="list">
        {day.topics.map((topic, i) => {
          const key = topicKey(weekNum, day.day_number, i);
          const isChecked = completed.has(key);
          const isBumping = justChecked === key;
          const checkboxId = `topic-${key}`;
          return (
            <li
              key={key}
              className={[
                "group flex items-start gap-3 rounded-xl px-1 -mx-1",
                isBumping ? "animate-topic-flash" : "",
              ].join(" ")}
            >
              <button
                id={checkboxId}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={`Mark "${topic}" as ${isChecked ? "incomplete" : "complete"}`}
                disabled={isPending}
                onClick={() => onToggle(key)}
                className={[
                  "mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isBumping ? "animate-check-bump" : "",
                  isChecked
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-white border-gray-300 hover:border-indigo-400",
                ].join(" ")}
              >
                {isChecked && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span
                className={[
                  "ep-topic-text text-sm leading-5 transition-all duration-200 select-none pt-0.5",
                  isChecked ? "ep-checked line-through text-slate-700" : "text-gray-700",
                ].join(" ")}
              >
                {topic}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlanViewer({
  planId,
  examName,
  examDate,
  plan,
}: PlanViewerProps) {
  // Initialise from server-fetched data
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    new Set(plan.completed_topics ?? [])
  );
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPressureMode, setIsPressureMode] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [activeTest, setActiveTest] = useState<"Mini-Test" | "Full Mock" | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeTestNumber, setActiveTestNumber] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"schedule" | "mocks">("schedule");
  
  // Test Engine State
  const [testQuestions, setTestQuestions] = useState<Question[] | null>(null);
  const [testScoringMap, setTestScoringMap] = useState<ScoringMap | null>(null);
  const [testFocusedSubjects, setTestFocusedSubjects] = useState<string[] | null>(null);
  const [testLoading, setTestLoading] = useState<"Mini-Test" | "Full Mock" | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [pendingNDATest, setPendingNDATest] = useState<"Mini-Test" | "Full Mock" | null>(null);
  const [useFocusMode, setUseFocusMode] = useState(true);

  const handleLaunchTest = async (type: "Mini-Test" | "Full Mock", targetExamOverride?: string) => {
    const examBase = examName;
    
    if (examBase === "NDA" && !targetExamOverride) {
      setPendingNDATest(type);
      return;
    }

    const finalTarget = targetExamOverride || examBase;
    setTestLoading(type);
    setTestError(null);

    const action = type === "Mini-Test" ? getMiniTest : getMockTest;
    const result = type === "Mini-Test" ? await getMiniTest(finalTarget, useFocusMode) : await getMockTest(finalTarget);

    setTestLoading(null);

    if (result.success) {
      // The attempt id is now issued by the server (getMockTest creates the
      // authoritative row and records the served question set). Never mint it
      // client-side — a client-chosen id would not map to a server-owned row.
      if (!result.attemptId) {
        setTestError("Could not start the test session. Please try again.");
        return;
      }
      setTestQuestions(result.questions);
      setTestScoringMap(result.scoringMap);
      setTestFocusedSubjects(result.focusedSubjects || null);
      setActiveAttemptId(result.attemptId);
      setActiveTestNumber(result.testNumber);
      setActiveTest(type);
      setPendingNDATest(null);
    } else {
      setTestError(result.error);
    }
  };

  // Exit pressure mode if the component unmounts (e.g. navigation)
  useEffect(() => () => setIsPressureMode(false), []);

  // Convenience
  const mockTests: MockTestResult[] = plan.mock_tests ?? [];

  const totalTopics = countAll(plan.weeks);
  const completedCount = countCompleted(plan.weeks, completedSet);
  const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Total study hours completed (only checked days where all topics are checked)
  const hoursCompleted = plan.weeks.reduce((acc, w) =>
    acc + w.days.reduce((a, d) => {
      const allDone = d.topics.every((_, i) =>
        completedSet.has(topicKey(w.week_number, d.day_number, i))
      );
      return a + (allDone ? d.estimated_hours : 0);
    }, 0), 0
  );
  const totalHours = plan.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.estimated_hours, 0), 0
  );

  function handleToggle(key: string) {
    // Trigger check-animation only when CHECKING (not unchecking)
    const isCurrentlyChecked = completedSet.has(key);
    if (!isCurrentlyChecked) {
      setJustChecked(key);
      // Clear after animation completes
      setTimeout(() => setJustChecked(null), 650);
    }

    // Optimistic UI update
    setCompletedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

    // Persist silently in the background
    startTransition(async () => {
      try {
        const saved = await toggleTopic(planId, key);
        setCompletedSet(new Set(saved)); // Sync with server truth
      } catch {
        // Revert optimistic update on error
        setCompletedSet((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key); else next.add(key);
          return next;
        });
      }
    });
  }

  return (
    <div
      data-pressure={isPressureMode ? "true" : undefined}
      className={[
        "flex flex-col gap-5 p-4 pb-24 transition-colors duration-300",
        isPressureMode
          ? "fixed inset-0 z-[60] overflow-y-auto bg-slate-900 pt-4"
          : "pt-6",
      ].join(" ")}
    >

      {/* Hero — hidden on print (replaced by the print header below) */}
      <div
        className="print:hidden relative rounded-2xl p-6 text-white overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #A5B4FC, transparent 70%)" }} aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
          Your AI Study Plan
        </p>
        <h1 className="relative text-2xl font-bold leading-tight mb-1">{examName}</h1>
        <p className="relative text-sm opacity-75">
          Exam on{" "}
          {new Date(examDate).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>

        {/* Progress bar inside hero */}
        <div className="relative mt-4">
          <div className="flex justify-between text-xs opacity-80 mb-1.5">
            <span>{completedCount} / {totalTopics} topics</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <MissionClock examDate={examDate} />

      {testError && (
        <div className="print:hidden bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-3 text-sm font-medium animate-fade-in">
          ⚠️ {testError}
        </div>
      )}

      {pendingNDATest && (
        <div className="print:hidden bg-slate-800 text-white p-5 rounded-3xl mb-4 border border-slate-700 shadow-xl relative overflow-hidden animate-fade-in">
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Select NDA Paper</h3>
            <p className="text-slate-300 text-xs mb-4">The NDA exam has two separate papers with distinct scoring algorithms.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleLaunchTest(pendingNDATest, "NDA_MATH")} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md">
                Mathematics (Paper I)
              </button>
              <button onClick={() => handleLaunchTest(pendingNDATest, "NDA_GAT")} className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md border border-slate-600">
                GAT (Paper II)
              </button>
            </div>
            <button onClick={() => setPendingNDATest(null)} className="mt-4 w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Test Engine Quick Actions ── */}
      <div className="print:hidden flex flex-col gap-2">
        <div className="flex items-center justify-end mb-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Target Weak Subjects</span>
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useFocusMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <input type="checkbox" className="sr-only" checked={useFocusMode} onChange={(e) => setUseFocusMode(e.target.checked)} />
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${useFocusMode ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLaunchTest("Mini-Test")}
            disabled={testLoading !== null}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-lg leading-none" aria-hidden="true">⚡</span>
            {testLoading === "Mini-Test" ? "Loading..." : "Daily Mini-Test"}
          </button>
          <button
            onClick={() => handleLaunchTest("Full Mock")}
            disabled={testLoading !== null}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-lg leading-none" aria-hidden="true">🎯</span>
            {testLoading === "Full Mock" ? "Loading..." : "Full Mock"}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="print:hidden grid grid-cols-3 gap-3">
        {[
          { label: "Total Days", value: plan.weeks.reduce((a, w) => a + w.days.length, 0), emoji: "📅" },
          { label: "Hours Done", value: `${hoursCompleted}/${totalHours}`, emoji: "⏱️" },
          { label: "Progress", value: `${progress}%`, emoji: "🎯" },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="ep-stat-card bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-xl" aria-hidden="true">{emoji}</span>
            <span className="ep-stat-value text-base font-bold text-gray-800 tabular-nums">{value}</span>
            <span className="ep-stat-label text-xs text-slate-700 text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Tab switcher: Schedule | Mock Tests ── */}
      <div className="print:hidden flex rounded-2xl bg-gray-100 p-1 gap-1" role="tablist" aria-label="Plan sections">
        {([
          { key: "schedule", icon: "📚", label: "Schedule",   badge: 0 },
          { key: "mocks",    icon: "🎯", label: "Mock Tests", badge: mockTests.length },
        ] as const).map(({ key, icon, label, badge }) => (
          <button
            key={key}
            id={`tab-${key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-slate-700 hover:text-gray-600",
            ].join(" ")}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
            {badge != null && badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* ── SCHEDULE TAB ── */}
      {activeTab === "schedule" && (
        <>
          <div className="print:hidden flex items-center gap-3">
            {!isPressureMode && (
              <button
                id="pressure-mode-toggle"
                type="button"
                onClick={() => setIsPressureMode(true)}
                aria-pressed={false}
                aria-label="Enter Exam Pressure Mode"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all duration-200 active:scale-[0.97] bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 shadow-sm"
              >
                <span aria-hidden="true" className="text-base leading-none">🔥</span>
                Pressure Mode
              </button>
            )}

            <button
              id="print-schedule-btn"
              type="button"
              onClick={() => setIsCheatSheetOpen(true)}
              aria-label="Generate AI Cheat Sheet"
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 shadow-sm transition-all duration-200 active:scale-[0.97]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Cheat Sheet
            </button>
          </div>

          {/* Save indicator */}
          {isPending && (
            <p className="print:hidden text-center text-xs text-indigo-400 animate-fade-in" aria-live="polite">
              Saving…
            </p>
          )}

          {/* Week-by-week schedule (hidden when printing) */}
          <div className="print:hidden flex flex-col gap-5">
            {plan.weeks.map((week) => (
              <section key={week.week_number} aria-labelledby={`week-${week.week_number}-label`}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
                    aria-hidden="true"
                  >
                    W{week.week_number}
                  </div>
                  <h2 id={`week-${week.week_number}-label`} className="ep-week-label text-sm font-bold text-gray-700">
                    Week {week.week_number}
                  </h2>
                  <div className="ep-week-divider flex-1 h-px bg-gray-100" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-3">
                  {week.days.map((day) => (
                    <DayCard
                      key={day.day_number}
                      day={day}
                      weekNum={week.week_number}
                      completed={completedSet}
                      justChecked={justChecked}
                      onToggle={handleToggle}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </section>
            ))}

            <p className="ep-footer-text text-center text-xs text-slate-700 leading-relaxed mt-2">
              Generated by ExamPilot AI · Tap any topic to mark it complete
            </p>
          </div>

          {/* Floating Pomodoro timer — screen only */}
          <div className="print:hidden">
            <FocusTimer />
          </div>
          
          {/* Floating Exit Focus Mode Button */}
          {isPressureMode && (
            <button
              onClick={() => setIsPressureMode(false)}
              aria-label="Exit Focus Mode"
              className="fixed top-6 right-6 z-[70] flex items-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-full text-xs font-bold border border-slate-700 shadow-2xl transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Exit Focus
            </button>
          )}

          {isCheatSheetOpen && (
            <CheatSheetView planId={planId} onClose={() => setIsCheatSheetOpen(false)} />
          )}

          {activeTest && testQuestions && testScoringMap && activeAttemptId && (
            <TestRunner type={activeTest} questions={testQuestions} scoringMap={testScoringMap} attemptId={activeAttemptId} initialState={activeTestNumber != null ? { testNumber: activeTestNumber } : undefined} focusedSubjects={testFocusedSubjects || undefined} onExit={() => setActiveTest(null)} />
          )}
        </>
      )}

      {/* ── MOCK TESTS TAB ── */}
      {activeTab === "mocks" && (
        <MockTestAnalyzer planId={planId} initialTests={mockTests} />
      )}


      {/* ══════════════════════════════════════════════════════════════
          PRINT-ONLY CHEAT SHEET
          Visible only when window.print() / Save as PDF is triggered.
          Two-column compact layout — exam-ready physical reference.
          ══════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block text-black">

        {/* Print header */}
        <div className="border-b-2 border-gray-800 pb-3 mb-5">
          <h1 className="text-xl font-black text-gray-900 leading-tight">{examName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1" style={{ fontSize: "10pt", color: "#4B5563" }}>
            <span>📅 {new Date(examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>✅ {completedCount}/{totalTopics} topics done ({progress}%)</span>
            <span>⏱️ {hoursCompleted}/{totalHours}h completed</span>
          </div>
          <p style={{ fontSize: "8pt", color: "#9CA3AF", marginTop: "4px" }}>
            Generated by ExamPilot AI · Print &amp; Ace Your Exam! 🚀
          </p>
        </div>

        {/* Two-column topic grid */}
        <div className="ep-print-columns">
          {plan.weeks.flatMap((week) =>
            week.days.map((day) => {
              const tags = [
                day.is_revision && "Revision",
                day.topics.some((t) => t.toLowerCase().includes("mock")) && "Mock",
              ].filter(Boolean).join(" · ");

              return (
                <div
                  key={`print-w${week.week_number}d${day.day_number}`}
                  className="ep-print-day"
                  style={{ border: "1px solid #D1D5DB", borderRadius: "6px", padding: "8px" }}
                >
                  {/* Day card header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", paddingBottom: "4px", marginBottom: "5px" }}>
                    <span style={{ fontSize: "7.5pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#374151" }}>
                      W{week.week_number} · Day {day.day_number}{tags ? ` · ${tags}` : ""}
                    </span>
                    <span style={{ fontSize: "7.5pt", color: "#6B7280" }}>{day.estimated_hours}h</span>
                  </div>

                  {/* Topic list */}
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {day.topics.map((topic, i) => {
                      const tKey = topicKey(week.week_number, day.day_number, i);
                      const isDone = completedSet.has(tKey);
                      return (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "8pt", lineHeight: "1.35" }}>
                          {/* Static print checkbox */}
                          <span style={{
                            flexShrink: 0, width: "9px", height: "9px",
                            border: "1.5px solid #6B7280", borderRadius: "2px",
                            display: "inline-block", marginTop: "1px",
                            background: isDone ? "#1F2937" : "white",
                          }} />
                          <span style={{ color: isDone ? "#9CA3AF" : "#111827", textDecoration: isDone ? "line-through" : "none" }}>
                            {topic}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
