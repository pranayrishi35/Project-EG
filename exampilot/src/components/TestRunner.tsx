"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
const MissionClock = dynamic(() => import("./MissionClock"), { ssr: false });
import { generateTestStrategy } from "@/app/actions/generateTestStrategy";
import { saveMockProgress } from "@/app/actions/mockAttempts";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { getLeaderboardMetrics } from "@/app/actions/getLeaderboardMetrics";
import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SkeletonCard from './SkeletonCard';
import { createClient } from '@/utils/supabase/client';
import PrimaryButton from './PrimaryButton';
import CreditModal from "./CreditModal";
import { create } from 'zustand';
import { EXAM_CONFIGS, ExamTarget } from "@/lib/examConfig";
import type { Question, ScoringMap } from "@/app/actions/getMockTest";

// --- Zustand Store (Granular State Management) ---

type QStatus = "unvisited" | "unanswered" | "answered" | "marked" | "answered_and_marked";

interface TestStore {
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number>;
  statuses: Record<string, QStatus>;
  
  initialize: (initialState: any, firstQuestionId?: string) => void;
  setCurrentQuestionIndex: (idx: number) => void;
  selectOption: (questionId: string, optionIndex: number) => void;
  clearResponse: (questionId: string) => void;
  markForReviewAndNext: (questionId: string, questions: any[]) => void;
  saveAndNext: (questionId: string, questions: any[]) => void;
  paletteClick: (idx: number, questions: any[]) => void;
}

const useTestStore = create<TestStore>((set) => ({
  currentQuestionIndex: 0,
  selectedAnswers: {},
  statuses: {},
  
  initialize: (initialState, firstQuestionId) => set((state) => {
    // Only initialize once to prevent race conditions
    if (Object.keys(state.statuses).length > 0) return state;
    
    let initialStatuses = initialState?.statuses || {};
    if (Object.keys(initialStatuses).length === 0 && firstQuestionId) {
       initialStatuses = { [firstQuestionId]: "unanswered" };
    }
    
    return {
      currentQuestionIndex: initialState?.currentQuestionIndex || 0,
      selectedAnswers: initialState?.selectedAnswers || {},
      statuses: initialStatuses
    };
  }),

  setCurrentQuestionIndex: (idx) => set({ currentQuestionIndex: idx }),
  
  selectOption: (questionId, optionIndex) => set((state) => ({
    selectedAnswers: { ...state.selectedAnswers, [questionId]: optionIndex }
  })),
  
  clearResponse: (questionId) => set((state) => {
    const nextAnswers = { ...state.selectedAnswers };
    delete nextAnswers[questionId];
    return {
      selectedAnswers: nextAnswers,
      statuses: { ...state.statuses, [questionId]: "unanswered" }
    };
  }),
  
  markForReviewAndNext: (questionId, questions) => set((state) => {
    const currentIndex = state.currentQuestionIndex;
    const currentSelected = state.selectedAnswers[questionId];
    
    const updatedStatuses = { ...state.statuses };
    updatedStatuses[questionId] = currentSelected !== undefined ? "answered_and_marked" : "marked";
    
    let nextIdx = currentIndex;
    if (currentIndex < questions.length - 1) {
      const nextId = questions[currentIndex + 1].id;
      updatedStatuses[nextId] = updatedStatuses[nextId] && updatedStatuses[nextId] !== "unvisited" ? updatedStatuses[nextId] : "unanswered";
      nextIdx = currentIndex + 1;
    }
    
    return { statuses: updatedStatuses, currentQuestionIndex: nextIdx };
  }),
  
  saveAndNext: (questionId, questions) => set((state) => {
    const currentIndex = state.currentQuestionIndex;
    const currentSelected = state.selectedAnswers[questionId];
    
    const updatedStatuses = { ...state.statuses };
    updatedStatuses[questionId] = currentSelected !== undefined ? "answered" : "unanswered";
    
    let nextIdx = currentIndex;
    if (currentIndex < questions.length - 1) {
      const nextId = questions[currentIndex + 1].id;
      updatedStatuses[nextId] = updatedStatuses[nextId] && updatedStatuses[nextId] !== "unvisited" ? updatedStatuses[nextId] : "unanswered";
      nextIdx = currentIndex + 1;
    }
    
    return { statuses: updatedStatuses, currentQuestionIndex: nextIdx };
  }),
  
  paletteClick: (idx, questions) => set((state) => {
    const prevIndex = state.currentQuestionIndex;
    const qId = questions[prevIndex].id;
    const nextStatuses = { ...state.statuses };
    
    if (!nextStatuses[qId] || nextStatuses[qId] === "unvisited") {
       nextStatuses[qId] = "unanswered";
    }
    const nextId = questions[idx].id;
    nextStatuses[nextId] = nextStatuses[nextId] && nextStatuses[nextId] !== "unvisited" ? nextStatuses[nextId] : "unanswered";
    
    return { statuses: nextStatuses, currentQuestionIndex: idx };
  }),
}));


// --- Memoized UI Components ---

const MemoizedTimer = memo(function MemoizedTimer({ initialSeconds, onTick, onTimeUp }: { initialSeconds: number, onTick: (s: number) => void, onTimeUp: () => void }) {
  return <MissionClock initialSeconds={initialSeconds} onTick={onTick} onTimeUp={onTimeUp} />;
});

const PaletteButton = memo(function PaletteButton({ questionId, questionNumber, index, isReviewMode, questions, onClickAction }: { questionId: string, questionNumber: number, index: number, isReviewMode: boolean, questions: any[], onClickAction?: () => void }) {
  const status = useTestStore(state => state.statuses[questionId] || "unvisited");
  const isActive = useTestStore(state => state.currentQuestionIndex === index);
  
  const paletteClick = useTestStore(state => state.paletteClick);
  const setCurrentQuestionIndex = useTestStore(state => state.setCurrentQuestionIndex);
  
  const onClick = () => {
    if (isReviewMode) {
      setCurrentQuestionIndex(index);
    } else {
      paletteClick(index, questions);
    }
    if (onClickAction) onClickAction();
  };

  let styleClass = "bg-slate-200 text-slate-700 rounded border border-slate-300";
  if (status === "unanswered") styleClass = "bg-red-500 text-white rounded-t-md shadow-sm";
  if (status === "answered") styleClass = "bg-green-600 text-white rounded-b-md shadow-sm";
  if (status === "marked") styleClass = "bg-purple-600 text-white rounded-full shadow-sm";
  if (status === "answered_and_marked") styleClass = "bg-purple-600 text-white rounded-full shadow-sm relative";
  
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 active:scale-95 relative z-50 pointer-events-auto ${styleClass} ${isActive ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
    >
      {questionNumber}
      {status === "answered_and_marked" && (
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
      )}
    </button>
  );
});

const OptionButton = memo(function OptionButton({ optionText, optionId, questionId, isReviewMode }: { optionText: string, optionId: number, questionId: string, isReviewMode: boolean }) {
  const isSelected = useTestStore(state => state.selectedAnswers[questionId] === optionId);
  const selectOption = useTestStore(state => state.selectOption);
  
  return (
    <button
      onClick={() => { if(!isReviewMode) selectOption(questionId, optionId) }}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group min-h-[44px] active:scale-[0.98] active:bg-slate-100 ${
        isSelected 
          ? 'border-indigo-600 bg-indigo-50 shadow-md' 
          : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        isSelected ? 'border-indigo-600 bg-indigo-600 text-white font-bold' : 'border-slate-400 text-transparent group-hover:border-slate-500'
      }`}>
        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
      </div>
      <span className={`text-base font-medium leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{optionText}</span>
    </button>
  );
});

const PaletteLegend = memo(function PaletteLegend({ questions }: { questions: any[] }) {
  const [counts, setCounts] = useState({ attemptedCount: 0, unattemptedCount: questions.length });

  // Use a targeted subscription effect to avoid Zustand shallow compare re-renders
  useEffect(() => {
    return useTestStore.subscribe((state) => {
      let attempted = 0;
      let unattempted = 0;
      questions.forEach((q) => {
        const s = state.statuses[q.id] || "unvisited";
        if (s === "answered" || s === "answered_and_marked") attempted++;
        else unattempted++;
      });
      setCounts({ attemptedCount: attempted, unattemptedCount: unattempted });
    });
  }, [questions]);

  return (
    <span className="text-xs text-slate-500 font-medium normal-case">
      Attempted: <strong className="text-slate-900">{counts.attemptedCount}</strong> | Not Attempted: <strong className="text-slate-900">{counts.unattemptedCount}</strong>
    </span>
  );
});

const PaletteLegendGrid = memo(function PaletteLegendGrid({ questions }: { questions: any[] }) {
  const [counts, setCounts] = useState({
    unvisited: questions.length,
    unanswered: 0,
    answered: 0,
    marked: 0,
    answered_and_marked: 0
  });

  useEffect(() => {
    return useTestStore.subscribe((state) => {
      const newCounts = {
        unvisited: 0,
        unanswered: 0,
        answered: 0,
        marked: 0,
        answered_and_marked: 0
      };
      questions.forEach((q) => {
        const s = state.statuses[q.id] || "unvisited";
        newCounts[s as keyof typeof newCounts]++;
      });
      setCounts(newCounts);
    });
  }, [questions]);

  return (
    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold text-slate-600">
      <div className="flex items-center gap-2">
         <div className="w-6 h-6 rounded bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700">{counts.unvisited}</div>
         <span>Unvisited</span>
      </div>
      <div className="flex items-center gap-2">
         <div className="w-6 h-6 bg-red-500 text-white flex items-center justify-center rounded-t-md">{counts.unanswered}</div>
         <span>Unanswered</span>
      </div>
      <div className="flex items-center gap-2">
         <div className="w-6 h-6 bg-green-600 text-white flex items-center justify-center rounded-b-md">{counts.answered}</div>
         <span>Answered</span>
      </div>
      <div className="flex items-center gap-2">
         <div className="w-6 h-6 bg-purple-600 text-white flex items-center justify-center rounded-full">{counts.marked}</div>
         <span>Marked</span>
      </div>
      <div className="flex items-center gap-2 col-span-2">
         <div className="w-6 h-6 bg-purple-600 text-white flex items-center justify-center rounded-full relative">
            {counts.answered_and_marked}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-[1.5px] border-white"></div>
         </div>
         <span>Answered & Marked</span>
      </div>
    </div>
  );
});

const MobilePaletteToggle = memo(function MobilePaletteToggle({ questions, onClick }: { questions: any[], onClick: () => void }) {
  const [counts, setCounts] = useState({ unanswered: 0, marked: 0 });
  useEffect(() => {
    return useTestStore.subscribe((state) => {
      let unans = 0;
      let mkd = 0;
      questions.forEach((q) => {
        const s = state.statuses[q.id] || "unvisited";
        if (s === "unanswered" || s === "unvisited") unans++;
        if (s === "marked" || s === "answered_and_marked") mkd++;
      });
      setCounts({ unanswered: unans, marked: mkd });
    });
  }, [questions]);
  
  return (
    <button onClick={onClick} className="md:hidden relative p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      {(counts.unanswered > 0 || counts.marked > 0) && (
        <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
          {counts.unanswered + counts.marked}
        </span>
      )}
    </button>
  );
});

const ActiveQuestionView = memo(function ActiveQuestionView({ questions, isReviewMode, onSubmit }: { questions: any[], isReviewMode: boolean, onSubmit?: () => void }) {
  const currentQuestionIndex = useTestStore(state => state.currentQuestionIndex);
  const currentQ = questions[currentQuestionIndex];
  const nextQ = questions[currentQuestionIndex + 1];
  
  const clearResponse = useTestStore(state => state.clearResponse);
  const markForReviewAndNext = useTestStore(state => state.markForReviewAndNext);
  const saveAndNext = useTestStore(state => state.saveAndNext);
  const setCurrentQuestionIndex = useTestStore(state => state.setCurrentQuestionIndex);
  
  // Swipe Handling
  const touchStartRef = useRef<{ x: number; y: number; time: number; target: EventTarget | null } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      target: e.target,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const { x: startX, y: startY, time: startTime, target } = touchStartRef.current;
    
    // Ignore if touch started on an element that might scroll horizontally (like an image wrapper or code block inside markdown, or a wide table)
    let el = target as HTMLElement | null;
    let isScrollable = false;
    while (el && el !== e.currentTarget) {
      if (el.scrollWidth > el.clientWidth) {
        isScrollable = true;
        break;
      }
      el = el.parentElement;
    }
    
    if (isScrollable) {
      touchStartRef.current = null;
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const dx = endX - startX;
    const dy = endY - startY;
    const dt = Date.now() - startTime;
    
    if (dt > 800) { // Too slow to be a swipe
       touchStartRef.current = null;
       return; 
    }

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && currentQuestionIndex < questions.length - 1) {
        // Swipe left -> Next Question (just navigate, don't save status)
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (dx > 0 && currentQuestionIndex > 0) {
        // Swipe right -> Prev Question
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    }
    touchStartRef.current = null;
  };

  if (!currentQ) return null;

  return (
    <>
      <div 
        className="flex-1 overflow-y-auto p-6 md:p-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <span className="text-slate-500 font-black text-lg uppercase tracking-widest">
            Question {currentQuestionIndex + 1}
          </span>
          {currentQ.pyqYear && (
            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
              ⭐ PYQ {currentQ.pyqYear}
            </span>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-6 text-slate-900">
          {currentQ.text}
        </h2>

        {currentQ.imageUrl && (
          <div className="relative w-full max-w-2xl h-64 md:h-80 mb-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
             <Image 
               src={currentQ.imageUrl} 
               alt="Question Asset" 
               fill 
               className="object-contain" 
               priority={true}
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             />
          </div>
        )}

        {nextQ?.imageUrl && (
          <div className="hidden">
             <Image 
               src={nextQ.imageUrl} 
               alt="Preload next asset" 
               width={10} 
               height={10} 
               priority={true} 
             />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {currentQ.options.map((option: string, idx: number) => (
            <OptionButton
              key={idx}
              optionText={option}
              optionId={idx}
              questionId={currentQ.id}
              isReviewMode={isReviewMode}
            />
          ))}
        </div>
      </div>
      
      {/* Action Bar outside the scrollable container */}
      <div className="bg-white border-t border-slate-300 p-4 safe-bottom flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] relative z-50 pointer-events-auto">
         <div className="flex justify-start">
            <button 
              onClick={() => { if(!isReviewMode) clearResponse(currentQ.id) }}
              className="px-4 md:px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs sm:text-sm min-h-[44px]"
            >
              Clear Response
            </button>
         </div>
         <div className="flex items-center justify-end gap-3 flex-1">
            <button 
              onClick={() => { if(!isReviewMode) markForReviewAndNext(currentQ.id, questions) }}
              className="px-3 md:px-6 py-3 rounded-lg bg-white border-2 border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-sm min-h-[44px] text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Mark for Review</span>
              <span className="sm:hidden">Mark Review</span>
            </button>
            <button 
              onClick={() => { if(!isReviewMode) saveAndNext(currentQ.id, questions) }}
              className="px-4 md:px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              Save & Next
            </button>
            {currentQuestionIndex === questions.length - 1 && !isReviewMode && (
              <button 
                onClick={onSubmit}
                className="px-4 md:px-8 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm min-h-[44px] ml-2"
              >
                Submit Exam
              </button>
            )}
         </div>
      </div>
    </>
  );
});

// --- Results View (Isolated) ---
const ResultsView = memo(function ResultsView({ type, questions, scoringMap, isReviewMode, onExit, testNumber, attemptId, submitFailed }: any) {
  const router = useRouter();
  const [archetype, setArchetype] = useState("Analytical & Technical");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [rankData, setRankData] = useState<{ global_rank?: number; global_percentile?: number; cohort_rank?: number; cohort_percentile?: number; cohort_key?: string; previousRank?: number; loading: boolean }>({ loading: true });
  
  // Prefetch the dashboard for instantaneous exit
  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const { statuses, selectedAnswers } = useTestStore.getState();

  const { completion, complete, isLoading: isAnalyzing, error: analysisError } = useCompletion({
    api: '/api/coach',
    // The route streams raw text (toTextStreamResponse); useCompletion defaults
    // to the "data" protocol, which would fail to parse plain-text chunks.
    streamProtocol: 'text',
    onError: (err) => {
      if (err.message.includes('INSUFFICIENT_CREDITS')) {
        setShowCreditModal(true);
      }
    }
  });

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;

  questions.forEach((q: any) => {
    const status = statuses[q.id] || "unvisited";
    const isConsidered = status === "answered" || status === "answered_and_marked";
    
    if (!isConsidered) {
      unattempted++;
    } else {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
      }
    }
  });

  const finalMarksCorrect = scoringMap?.correct || 3;
  const finalMarksIncorrect = scoringMap?.incorrect || -1;

  const rawScore = (correct * finalMarksCorrect) + (incorrect * finalMarksIncorrect);
  const score = rawScore.toFixed(2);
  const maxScore = (questions.length * finalMarksCorrect).toFixed(2);
  const accuracy = ((correct / (correct + incorrect || 1)) * 100).toFixed(1);

  // Compute Subject Stats dynamically for display
  const config = EXAM_CONFIGS[type as ExamTarget];
  const subjectStats: Record<string, { correct: number; total: number }> = {};
  
  if (config) {
    for (const [subject, total] of Object.entries(config.subject_breakdown)) {
      subjectStats[subject] = { correct: 0, total };
    }
  }

  questions.forEach((q: any) => {
    const subject = q.subject || "General Awareness";
    const status = statuses[q.id] || "unvisited";
    const isConsidered = status === "answered" || status === "answered_and_marked";
    
    if (isConsidered) {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctIndex) {
        if (!subjectStats[subject]) {
           subjectStats[subject] = { correct: 0, total: 0 };
        }
        subjectStats[subject].correct++;
      }
    }
    
    if (!config) {
      if (!subjectStats[subject]) {
         subjectStats[subject] = { correct: 0, total: 0 };
      }
      subjectStats[subject].total++;
    }
  });

  useEffect(() => {
    async function fetchRank() {
      if (!testNumber || isReviewMode || !attemptId) {
        setRankData({ loading: false });
        return;
      }
      const res = await getLeaderboardMetrics(attemptId);
      if (res.success) {
        const cacheKey = `exampilot_rank_${type}_${testNumber}`;
        const previousRankStr = localStorage.getItem(cacheKey);
        const previousRank = previousRankStr ? parseInt(previousRankStr, 10) : undefined;
        
        setRankData({ 
          global_rank: res.global_rank, 
          global_percentile: res.global_percentile,
          cohort_rank: res.cohort_rank,
          cohort_percentile: res.cohort_percentile,
          cohort_key: res.cohort_key,
          previousRank, 
          loading: false 
        });
        
        if (res.cohort_rank) {
          localStorage.setItem(cacheKey, res.cohort_rank.toString());
        }
      } else {
        setRankData({ loading: false });
      }
    }
    fetchRank();
  }, [attemptId, testNumber, isReviewMode, type]);

  const handleAnalyze = async (computedScore: number, computedMaxScore: number) => {
    const incorrectSubjects = new Set<string>();
    questions.forEach((q: any) => {
      const status = statuses[q.id] || "unvisited";
      const isConsidered = status === "answered" || status === "answered_and_marked";
      if (isConsidered) {
        const selected = selectedAnswers[q.id];
        if (selected !== q.correctIndex) {
          incorrectSubjects.add(q.subject || "General");
        }
      }
    });

    const subjectsContext = Array.from(incorrectSubjects).length > 0
      ? `They missed questions in the following subjects: ${Array.from(incorrectSubjects).join(", ")}.`
      : `They scored a perfect test!`;

    // Per-subject accuracy breakdown for this attempt — gives the coach concrete,
    // candidate-specific signal (which subjects are weakest by ratio, not just
    // which had any miss) so the debrief is tailored rather than generic.
    const subjectBreakdown = Object.entries(subjectStats)
      .filter(([, s]) => s.total > 0)
      .map(([subject, s]) => `${subject}: ${s.correct}/${s.total}`)
      .join("; ");

    // Unattempted count is a time-management signal the coach should address
    // separately from wrong answers (pacing vs. knowledge gap).
    const pacingContext = unattempted > 0
      ? ` They left ${unattempted} question(s) unattempted, which may indicate a time-management issue.`
      : ``;

    const prompt = `Analyze this ${type} result for a ${type === "Mini-Test" ? "practice drill" : "full mock"}. The student scored ${computedScore} out of ${computedMaxScore} (${accuracy}% accuracy). ${subjectsContext}${pacingContext}${subjectBreakdown ? `\nPer-subject performance — ${subjectBreakdown}.` : ""}\nThe student learns best via the "${archetype}" archetype. Tailor the weaknesses and action plan to their weakest subjects by ratio.`;

    await complete(prompt);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-start pt-12 pb-24 px-6 text-white overflow-y-auto animate-fade-in print:static print:bg-white print:text-black print:h-auto print:overflow-visible print:p-0">
      <div className="w-full max-w-2xl bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 print:bg-transparent print:border-none print:shadow-none print:p-0 print:max-w-none">
        <h2 className="text-3xl font-black text-center mb-2 print:text-black">{isReviewMode ? "Review Mode" : "Results Summary"}</h2>
        <p className="text-slate-400 text-center mb-8 font-medium uppercase tracking-widest text-sm print:text-black">{type}</p>

        {submitFailed && (
          <div role="alert" className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-center print:hidden">
            <p className="text-sm font-bold text-amber-300">
              We couldn&apos;t confirm your submission was saved.
            </p>
            <p className="mt-1 text-xs font-medium text-amber-200/80">
              Your answers are stored on this device and will be retried automatically when you reconnect. Keep this tab open until the warning clears.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700/50 p-4 rounded-2xl flex flex-col items-center border border-slate-600">
            <span className="text-4xl font-black text-indigo-400 mb-1">{score}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-auto">Score / {maxScore}</span>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-2xl flex flex-col items-center border border-slate-600">
            <span className="text-4xl font-black text-emerald-400 mb-1">{accuracy}%</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-auto">Accuracy</span>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-2xl flex flex-col items-center border border-slate-600">
            {rankData.loading ? (
              <span className="text-sm font-bold text-slate-500 mb-1 mt-3 animate-pulse">Calculating...</span>
            ) : rankData.cohort_rank ? (
              <div className="flex flex-col items-center mb-1">
                <span className="text-4xl font-black text-amber-400">#{rankData.cohort_rank}</span>
                <span className="text-[10px] font-bold mt-1 text-slate-400">Top {rankData.cohort_percentile}%</span>
                {rankData.previousRank && rankData.previousRank !== rankData.cohort_rank && (
                  <div className={`text-[10px] font-bold mt-1 ${rankData.cohort_rank < rankData.previousRank ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rankData.previousRank} → {rankData.cohort_rank} ({rankData.cohort_rank < rankData.previousRank ? '+' : ''}{rankData.previousRank - rankData.cohort_rank})
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-500 mb-1 mt-3">N/A</span>
            )}
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-auto text-center">
              Cohort Rank<br/>
              {rankData.cohort_key && rankData.cohort_key !== 'GLOBAL' && (
                 <span className="text-[9px] opacity-60 normal-case tracking-widest">{rankData.cohort_key.replace(/_/g, ' ')}</span>
              )}
            </span>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-2xl flex flex-col items-center border border-slate-600">
            {rankData.loading ? (
              <span className="text-sm font-bold text-slate-500 mb-1 mt-3 animate-pulse">Calculating...</span>
            ) : rankData.global_rank ? (
              <div className="flex flex-col items-center mb-1">
                <span className="text-4xl font-black text-sky-400">#{rankData.global_rank}</span>
                <span className="text-[10px] font-bold mt-1 text-slate-400">Top {rankData.global_percentile}%</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-500 mb-1 mt-3">N/A</span>
            )}
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-auto text-center">Global Rank</span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center text-sm font-medium bg-emerald-900/20 border border-emerald-900/30 p-3 rounded-xl text-emerald-400">
            <span>Correct (+{finalMarksCorrect})</span>
            <span className="font-bold text-lg">{correct}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium bg-rose-900/20 border border-rose-900/30 p-3 rounded-xl text-rose-400">
            <span>Incorrect ({finalMarksIncorrect})</span>
            <span className="font-bold text-lg">{incorrect}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium bg-slate-700/30 border border-slate-700/50 p-3 rounded-xl text-slate-300">
            <span>Skipped / Unmarked</span>
            <span className="font-bold text-lg">{unattempted}</span>
          </div>
        </div>

        {/* Subject-Wise Breakdown */}
        {Object.keys(subjectStats).length > 0 && (
          <div className="mb-8 w-full print:break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-black">
              Subject Accuracy
            </h3>
            <div className="space-y-4">
              {Object.entries(subjectStats).map(([subject, stats]) => {
                const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={subject} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-300 print:text-black">{subject}</span>
                      <span className="text-indigo-400 print:text-indigo-700">{percentage}% <span className="text-slate-500 font-medium">({stats.correct}/{stats.total})</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden print:border print:border-gray-300">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000 ease-out print:bg-indigo-600" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full bg-slate-700/30 border border-slate-700/50 rounded-2xl p-6 mb-8 print:hidden">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span aria-hidden="true">🧠</span> AI Tactical Coach
          </h3>
          
          {!completion && !isAnalyzing ? (
            <div className="flex flex-col gap-4">
              {analysisError && (
                <div className="bg-red-900/20 border border-red-900/30 p-3 rounded-xl text-red-400 text-sm font-medium">
                  {analysisError.message}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Learning Archetype</label>
                <select 
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-base rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Analytical & Technical">Analytical & Technical</option>
                  <option value="Visual & Conceptual">Visual & Conceptual</option>
                  <option value="Drill & Repetition">Drill & Repetition</option>
                </select>
              </div>
              
              <button 
                onClick={() => handleAnalyze(parseFloat(score), parseFloat(maxScore))}
                disabled={isAnalyzing}
                className="w-full py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 hover:border-indigo-500/50 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Analyze Performance (AI)
              </button>
            </div>
          ) : (
            <div className="bg-indigo-950/30 border border-indigo-500/20 p-5 rounded-xl text-indigo-100 text-sm leading-relaxed animate-fade-in shadow-inner prose prose-invert prose-sm prose-indigo prose-p:my-2 prose-headings:text-indigo-400 prose-headings:font-black prose-headings:tracking-widest prose-headings:uppercase prose-headings:text-sm prose-headings:border-b prose-headings:border-indigo-500/30 prose-headings:pb-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {completion}
              </ReactMarkdown>
              {isAnalyzing && (
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 w-full border-t border-slate-700 pt-8 print:border-none print:pt-4">
          <h3 className="text-2xl font-black text-center mb-6 print:text-black">Mission Debriefing</h3>
          <div className="flex flex-col gap-4">
            {questions.map((q: any, idx: number) => {
              const status = statuses[q.id] || "unvisited";
              const isConsidered = status === "answered" || status === "answered_and_marked";
              
              let isCorrect = false;
              let isUnattempted = true;
              if (isConsidered) {
                isCorrect = selectedAnswers[q.id] === q.correctIndex;
                isUnattempted = false;
              }
              
              return (
                <div key={q.id} className={`p-5 rounded-2xl border transition-colors ${isCorrect ? 'bg-emerald-900/10 border-emerald-900/30 print:border-gray-300' : isUnattempted ? 'bg-slate-800/50 border-slate-700 print:border-gray-300' : 'bg-rose-900/10 border-rose-900/30 print:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest print:text-black">Q{idx + 1} • {q.subject}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCorrect ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-700' : isUnattempted ? 'bg-slate-700 text-slate-300 print:text-gray-600' : 'bg-rose-500/20 text-rose-400 print:text-rose-700'}`}>
                      {isCorrect ? 'Correct' : isUnattempted ? 'Skipped/Unmarked' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-white text-sm mb-4 print:text-black">{q.text}</p>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-slate-500 mt-0.5 print:text-black w-16 shrink-0">Your Ans:</span>
                      <span className={`text-sm ${isCorrect ? 'text-emerald-400 font-semibold print:text-emerald-700' : isUnattempted ? 'text-slate-500 italic print:text-gray-500' : 'text-rose-400 font-semibold line-through print:text-rose-700'}`}>
                        {isUnattempted ? 'None' : q.options[selectedAnswers[q.id]]}
                      </span>
                    </div>
                    
                    {!isCorrect && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-emerald-500 mt-0.5 print:text-emerald-700 w-16 shrink-0">Correct:</span>
                        <span className="text-sm text-emerald-400 font-semibold print:text-emerald-700">
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PrimaryButton onClick={onExit} className="w-full py-4 shadow-lg text-lg">
          Exit to Dashboard
        </PrimaryButton>
      </div>
      <CreditModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  );
});

// --- Main CBT Engine ---

interface TestRunnerProps {
  type: "Mini-Test" | "Full Mock";
  questions: Question[];
  scoringMap: ScoringMap;
  onExit: () => void;
  attemptId?: string;
  initialState?: any;
  isReviewMode?: boolean;
  candidateName?: string;
  focusedSubjects?: string[];
  // Opt-in grader for attempt-less tests (the Daily Current Affairs drill). When
  // provided and there is no attemptId, submission is graded through this action
  // instead of the mock_attempts path — so a daily drill is scored correctly
  // server-side without being recorded as a ranked mock. Existing mock callers
  // omit it and are completely unaffected.
  onGrade?: (payload: {
    questionIds: string[];
    selectedAnswers: Record<string, number>;
    statuses: Record<string, QStatus>;
  }) => Promise<
    | { success: true; gradedQuestions: Question[] }
    | { success: false; error: string }
  >;
}

export default function TestRunner({ type, questions, scoringMap, onExit, attemptId, initialState, isReviewMode, candidateName, focusedSubjects, onGrade }: TestRunnerProps) {
  const isOnline = useNetworkStatus();
  
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || false);
  
  // Timer seed priority: (1) a resumed attempt's remaining time, (2) the
  // server-provided authoritative duration for this exam (scoringMap.durationSeconds
  // — e.g. NDA is 150 min, not 120), (3) a legacy per-type fallback for attempts
  // persisted before durationSeconds existed.
  const timeRemainingRef = useRef<number>(
    initialState?.timeRemaining ??
    scoringMap?.durationSeconds ??
    (type === "Mini-Test" ? 15 * 60 : 120 * 60)
  );
  const testNumberRef = useRef<number | undefined>(initialState?.testNumber);
  const syncBlockedUntilRef = useRef<number>(0);
  
  const answersRef = useRef({ currentQuestionIndex: 0, selectedAnswers: {}, statuses: {} });
  const isSubmittedRef = useRef(isSubmitted);
  
  const [warningStrike, setWarningStrike] = useState<number | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  // Guard against an accidental tap on "Submit Exam" ending the test. A manual
  // submit opens this confirmation first; auto-submit (timer / anti-cheat) still
  // calls handleSubmit directly and bypasses the dialog.
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  // Questions carrying the server-injected correctIndex, returned by the grading
  // action on submit. In live mode the questions prop has correctIndex stripped
  // (anti-cheat), so the debrief/review must use this hydrated set instead.
  const [gradedQuestions, setGradedQuestions] = useState<Question[] | null>(null);
  // Set when a completed submission failed to persist, so the UI can warn the
  // user instead of silently discarding their attempt. The local mirror is kept
  // and retried on reconnect.
  const [submitFailed, setSubmitFailed] = useState(false);

  // Navigation Guard Effect
  useEffect(() => {
    if (isReviewMode || isSubmitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };

    const handlePopState = (e: PopStateEvent) => {
      // Prevent immediate navigation
      window.history.pushState(null, '', window.location.href);
      setShowExitWarning(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isReviewMode, isSubmitted]);

  // Initialize Store exactly once when the component mounts
  useEffect(() => {
    let loadedState = initialState;
    if (attemptId && !initialState) {
      const storedStr = localStorage.getItem(`mock_attempt_${attemptId}`);
      if (storedStr) {
        try {
          const stored = JSON.parse(storedStr);
          loadedState = stored;
          if (stored.timeRemaining) timeRemainingRef.current = stored.timeRemaining;
          if (stored.testNumber) testNumberRef.current = stored.testNumber;
        } catch (e) {
          console.error("Failed to parse local storage", e);
        }
      }
    }
    useTestStore.getState().initialize(loadedState, questions[0]?.id);
    
    // Clear store on unmount to prevent state leaking between tests
    return () => useTestStore.setState({ currentQuestionIndex: 0, selectedAnswers: {}, statuses: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, initialState, questions]);

  const performSync = useCallback(async (payload: any, force = false) => {
    if (!force && Date.now() < syncBlockedUntilRef.current) return;
    
    if (testNumberRef.current !== undefined) {
      payload.test_number = testNumberRef.current;
      payload.answers_state = { ...payload.answers_state, testNumber: testNumberRef.current };
    }

    try {
      const res = await saveMockProgress(payload);
      if (res.success && res.data?.test_number) {
        testNumberRef.current = res.data.test_number;
      } else if (!res.success) {
        const code = res.code || '';
        const msg = String(res.error || '');
        if (code === '23502' || code === '23505' || msg.includes('500') || msg.includes('constraint')) {
          syncBlockedUntilRef.current = Date.now() + 30000;
        }
      }
      return res;
    } catch (err) {
      syncBlockedUntilRef.current = Date.now() + 30000;
      return { success: false, error: 'NETWORK_ERROR' } as const;
    }
  }, []);

  // Local Storage Auto-Save & Mirror Ref Sync (Decoupled Subscription)
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
    if (isReviewMode) return;
    
    const unsubscribe = useTestStore.subscribe((state) => {
      answersRef.current = {
        currentQuestionIndex: state.currentQuestionIndex,
        selectedAnswers: state.selectedAnswers,
        statuses: state.statuses
      };
      
      if (isSubmittedRef.current || !attemptId) return;
      
      const payload = {
        currentQuestionIndex: state.currentQuestionIndex,
        selectedAnswers: state.selectedAnswers,
        statuses: state.statuses,
        timeRemaining: timeRemainingRef.current,
        testNumber: testNumberRef.current
      };
      localStorage.setItem(`mock_attempt_${attemptId}`, JSON.stringify(payload));
    });

    return unsubscribe;
  }, [attemptId, isReviewMode, isSubmitted]);

  // Decoupled Network Thread (Dual-State Architecture)
  useEffect(() => {
    if (isReviewMode || !attemptId) return;

    const syncToCloud = async () => {
      // Read directly from navigator and refs to avoid stale closures and UI glitching
      if (!navigator.onLine || isSubmittedRef.current) return;
      
      const payload = {
        id: attemptId,
        exam_target: type,
        status: 'in_progress',
        time_remaining: timeRemainingRef.current,
        answers_state: { 
          currentQuestionIndex: answersRef.current.currentQuestionIndex, 
          selectedAnswers: answersRef.current.selectedAnswers, 
          statuses: answersRef.current.statuses, 
          questions, 
          scoringMap 
        }
      };
      await performSync(payload);
    };

    const interval = setInterval(syncToCloud, 60000); // 60 seconds
    window.addEventListener('online', syncToCloud);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncToCloud);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attempt to persist the completed attempt. Returns true only when the server
  // confirms the write. On failure the local mirror is preserved so the attempt
  // can be flushed on reconnect instead of being silently lost.
  const flushCompletion = useCallback(async () => {
    // Attempt-less grading path (Daily Current Affairs drill). No mock_attempts
    // row exists for this test, so the ranked-attempt sync below is skipped;
    // instead we grade through onGrade, which returns the questions with the
    // authoritative correctIndex injected so the debrief scores correctly.
    if (!attemptId && onGrade) {
      if (!navigator.onLine) {
        setSubmitFailed(true);
        return false;
      }
      const { statuses, selectedAnswers } = useTestStore.getState();
      const res = await onGrade({
        questionIds: questions.map((q) => q.id),
        selectedAnswers,
        statuses,
      });
      if (res?.success) {
        setGradedQuestions(res.gradedQuestions);
        setSubmitFailed(false);
        return true;
      }
      setSubmitFailed(true);
      return false;
    }

    if (!attemptId) return false;
    if (!navigator.onLine) {
      setSubmitFailed(true);
      return false;
    }

    const { statuses, selectedAnswers, currentQuestionIndex } = useTestStore.getState();

    // The client no longer computes the authoritative score — the server
    // recomputes it from the answer key (correctIndex is stripped from the
    // live `questions` prop for anti-cheat). We only submit the raw response
    // set; the server returns the graded questions with correctIndex injected.
    const res = await performSync({
      id: attemptId,
      exam_target: type,
      status: 'completed',
      time_remaining: timeRemainingRef.current,
      answers_state: { currentQuestionIndex, selectedAnswers, statuses, questions, scoringMap }
    }, true);

    if (res?.success) {
      const graded = res.data?.answers_state?.questions;
      if (Array.isArray(graded) && graded.length > 0) {
        setGradedQuestions(graded);
      }
      localStorage.removeItem(`mock_attempt_${attemptId}`);
      setSubmitFailed(false);
      return true;
    }

    setSubmitFailed(true);
    return false;
  }, [attemptId, questions, type, scoringMap, performSync, onGrade]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitted(true);
    isSubmittedRef.current = true;
    setWarningStrike(null); // Clear any pending warnings
    await flushCompletion();
  }, [flushCompletion]);

  // Retry a failed completion when connectivity returns, so a submission made
  // while offline (or during a transient server error) is not silently dropped.
  useEffect(() => {
    if (!submitFailed) return;
    if (isOnline) {
      flushCompletion();
    }
  }, [isOnline, submitFailed, flushCompletion]);

  useAntiCheat({
    onForceSubmit: handleSubmit,
    onWarning: setWarningStrike,
    isActive: !isReviewMode && !isSubmitted
  });

  const handleTick = useCallback((s: number) => { timeRemainingRef.current = s; }, []);

  // A manual "Submit Exam" tap is irreversible (the attempt is graded and locked
  // server-side), so gate it behind a confirmation. Auto-submit paths (timer,
  // 3-strike anti-cheat) still call handleSubmit directly and are not gated.
  const requestSubmit = useCallback(() => {
    if (isReviewMode) return;
    setShowSubmitConfirm(true);
  }, [isReviewMode]);

  const confirmSubmit = useCallback(() => {
    setShowSubmitConfirm(false);
    void handleSubmit();
  }, [handleSubmit]);

  if (isSubmitted) {
    // In review mode the page-level loader already hydrates `questions` from the
    // stored answers_state (which carries correctIndex). In live mode we prefer
    // the server-graded set returned on submit; falling back to the prop only
    // when the sync failed (offline), where scoring is best-effort.
    const debriefQuestions = gradedQuestions ?? questions;
    return <ResultsView type={type} questions={debriefQuestions} scoringMap={scoringMap} isReviewMode={isReviewMode} onExit={onExit} testNumber={testNumberRef.current} attemptId={attemptId} submitFailed={submitFailed} />;
  }

  // Active Test UI - AFCAT CBT Style
  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col print:static print:bg-white print:text-black print:h-auto print:overflow-visible text-slate-900 select-none">
      
      {/* Anti-Cheat Warning Modal */}
      {warningStrike !== null && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Security Violation</h3>
            <p className="text-slate-600 mb-6 font-medium">Please do not switch tabs, copy text, or right-click. Repeated violations will result in automatic submission.</p>
            <div className="bg-red-50 text-red-700 font-bold py-2 px-4 rounded-lg mb-6">
              Strike {warningStrike} / 3
            </div>
            <button onClick={() => setWarningStrike(null)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95">
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal — a manual submit is final (attempt is graded
          and locked), so require an explicit confirm to avoid an accidental tap
          ending the test. */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-t-4 border-indigo-500">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Submit Exam?</h3>
            <p className="text-slate-600 mb-6 font-medium">Once submitted, this attempt is graded and locked — you cannot change your answers. Make sure you have reviewed your responses.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmSubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 min-h-[44px]">
                Yes, Submit Now
              </button>
              <button onClick={() => setShowSubmitConfirm(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95 min-h-[44px]">
                Keep Working
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-t-4 border-amber-500">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Leave Test?</h3>
            <p className="text-slate-600 mb-6 font-medium">Your progress is automatically saved. You can resume later from the dashboard.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowExitWarning(false)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95">
                Stay in Test
              </button>
              <button onClick={() => { setShowExitWarning(false); onExit(); }} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95">
                Leave to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex items-center justify-between shadow-sm pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-xl" aria-hidden="true">{type === "Mini-Test" ? "⚡" : "🎯"}</span>
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-lg leading-tight">{type}</h1>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">AFCAT CBT Portal</p>
          </div>
          {/* Marking-scheme cue — kept visible DURING the test (not just on the
              results screen) so the negative-marking risk is present while the
              candidate decides whether to guess under time pressure. Values are
              authoritative (from scoringMap); incorrect is stored negative. */}
          {scoringMap && (
            <div
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl"
              title={`Marking scheme: +${scoringMap.correct} per correct answer, ${scoringMap.incorrect} per wrong answer`}
            >
              <span className="text-xs font-black text-emerald-600">+{scoringMap.correct}</span>
              <span className="text-slate-300 text-xs" aria-hidden="true">·</span>
              <span className="text-xs font-black text-red-600">{scoringMap.incorrect}</span>
              <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-0.5">marking</span>
            </div>
          )}
          {focusedSubjects && focusedSubjects.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl ml-4">
              <span className="text-sm">🎯</span>
              <span className="text-xs font-bold text-purple-700">Focused on: {focusedSubjects.join(", ")}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <MobilePaletteToggle questions={questions} onClick={() => setIsPaletteOpen(true)} />
          <div className={`hidden md:flex px-3 py-1 rounded-full text-xs font-bold items-center gap-2 ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <MemoizedTimer 
            initialSeconds={timeRemainingRef.current} 
            onTick={handleTick}
            onTimeUp={handleSubmit}
          />
          
          <div className="hidden md:flex items-center gap-3 border-l border-slate-300 pl-6">
            <div className="text-right">
              <p className="text-xs text-slate-500 font-bold uppercase">Candidate</p>
              <p className="text-sm font-black text-slate-900">{candidateName || 'Pilot'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] mx-auto w-full">
        
        {/* Left Column - Active Question */}
        <div className="flex-1 flex flex-col min-h-0 bg-white relative z-10 w-full">
          <ActiveQuestionView questions={questions} isReviewMode={isReviewMode || false} onSubmit={requestSubmit} />
        </div>

        {/* Right Column - Question Palette */}
        <div className={`fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isPaletteOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsPaletteOpen(false)}></div>
        
        <div className={`fixed md:relative right-0 top-0 bottom-0 z-[160] w-full max-w-[320px] md:max-w-none md:w-[320px] lg:w-[380px] bg-slate-50 flex flex-col border-l border-slate-300 flex-shrink-0 pointer-events-auto transform transition-transform duration-300 md:transform-none ${isPaletteOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          {/* Close button for mobile */}
          <div className="md:hidden absolute top-4 right-4 z-[170]">
            <button onClick={() => setIsPaletteOpen(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-300 bg-white">
            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider flex justify-between">
              <span>Legend</span>
              <PaletteLegend questions={questions} />
            </h3>
            <PaletteLegendGrid questions={questions} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
             <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Question Palette</h3>
             <div className="grid grid-cols-5 gap-3">
               {questions.map((q, index) => (
                 <PaletteButton
                   key={q.id}
                   index={index}
                   questionId={q.id}
                   questionNumber={index + 1}
                   isReviewMode={isReviewMode || false}
                   questions={questions}
                   onClickAction={() => setIsPaletteOpen(false)}
                 />
               ))}
             </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-300 safe-bottom">
            <button
              onClick={requestSubmit}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              Submit Exam
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
