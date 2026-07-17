"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import { getDemoAnswerKey } from "@/app/actions/getDemoMock";
import type { Question } from "@/app/actions/getMockTest";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import PrimaryButton from "./PrimaryButton";

const MissionClock = dynamic(() => import("./MissionClock"), { ssr: false });

type QStatus = "unvisited" | "unanswered" | "answered" | "marked" | "answered_and_marked";

export default function DemoTestRunner({ questions }: { questions: Question[] }) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Record<string, QStatus>>({});

  const timeRemainingRef = useRef(5 * 60); // 5 minutes demo
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("exampilot_guest_attempt");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed.selectedAnswers || {}).length > 0) {
          setSelectedAnswers(parsed.selectedAnswers || {});
          setStatuses(parsed.statuses || {});
          setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
          timeRemainingRef.current = parsed.timeRemaining || 5 * 60;
        }
      } catch (e) {
        console.error("Failed to parse guest attempt", e);
      }
    } else if (questions.length > 0) {
       setStatuses({ [questions[0].id]: "unanswered" });
    }
    setHasHydrated(true);
  }, [questions]);

  // Auto-save guest progress to local storage on interactions
  useEffect(() => {
    if (!hasHydrated || isSubmitted) return;
    const progress = {
      selectedAnswers,
      statuses,
      currentQuestionIndex,
      timeRemaining: timeRemainingRef.current
    };
    localStorage.setItem("exampilot_guest_attempt", JSON.stringify(progress));
  }, [selectedAnswers, statuses, currentQuestionIndex, isSubmitted, hasHydrated]);

  const handleTick = useCallback((s: number) => {
    timeRemainingRef.current = s;
  }, []);

  const selectOption = useCallback((qId: string, optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
  }, []);

  const clearResponse = useCallback((qId: string) => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setStatuses(prev => ({ ...prev, [qId]: "unanswered" }));
  }, []);

  const markForReviewAndNext = useCallback((qId: string) => {
    setSelectedAnswers(prevAnswers => {
      const isAnswered = prevAnswers[qId] !== undefined;
      setStatuses(prev => ({
        ...prev,
        [qId]: isAnswered ? "answered_and_marked" : "marked"
      }));
      return prevAnswers;
    });
    goNext();
  }, [questions, currentQuestionIndex]);

  const saveAndNext = useCallback((qId: string) => {
    setSelectedAnswers(prevAnswers => {
      const isAnswered = prevAnswers[qId] !== undefined;
      setStatuses(prev => ({
        ...prev,
        [qId]: isAnswered ? "answered" : "unanswered"
      }));
      return prevAnswers;
    });
    goNext();
  }, [questions, currentQuestionIndex]);

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      const nextId = questions[nextIdx].id;
      setStatuses(prev => ({
        ...prev,
        [nextId]: prev[nextId] && prev[nextId] !== "unvisited" ? prev[nextId] : "unanswered"
      }));
      setCurrentQuestionIndex(nextIdx);
    }
  };

  const paletteClick = useCallback((idx: number) => {
    const prevQId = questions[currentQuestionIndex].id;
    setStatuses(prev => {
      const nextStatuses = { ...prev };
      if (!nextStatuses[prevQId] || nextStatuses[prevQId] === "unvisited") {
        nextStatuses[prevQId] = "unanswered";
      }
      const nextId = questions[idx].id;
      nextStatuses[nextId] = nextStatuses[nextId] && nextStatuses[nextId] !== "unvisited" ? nextStatuses[nextId] : "unanswered";
      return nextStatuses;
    });
    setCurrentQuestionIndex(idx);
  }, [questions, currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const questionIds = questions.map(q => q.id);
    const { success, answers } = await getDemoAnswerKey(questionIds);
    
    if (success && answers) {
      let correctCount = 0;
      let incorrectCount = 0;

      answers.forEach(ans => {
        const userSelected = selectedAnswers[ans.id];
        if (userSelected !== undefined) {
          if (userSelected === ans.correct_index) correctCount++;
          else incorrectCount++;
        }
      });
      
      const calculatedScore = (correctCount * 4) - (incorrectCount * 1);
      setScore(calculatedScore);
    } else {
      setScore(0);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
  }, [isSubmitting, questions, selectedAnswers]);

  if (!hasHydrated || questions.length === 0) {
    return <div className="p-8 text-center bg-gray-50 rounded-xl animate-pulse min-h-[600px] flex items-center justify-center">Loading demo module...</div>;
  }

  if (isSubmitted) {
    let percentileMsg = "You're just getting started. Let our AI build your foundation!";
    let highlightColor = "text-slate-600";
    if (score !== null && score > 0) {
      if (score <= 10) {
        percentileMsg = "You're ahead of 34% of casual aspirants! A solid start.";
        highlightColor = "text-amber-600";
      } else if (score <= 20) {
        percentileMsg = "You're ahead of 58% of casual aspirants! Keep pushing!";
        highlightColor = "text-indigo-600";
      } else if (score <= 30) {
        percentileMsg = "You're ahead of 82% of casual aspirants! Great work.";
        highlightColor = "text-emerald-600";
      } else {
        percentileMsg = "You're ahead of 96% of casual aspirants! Top tier performance!";
        highlightColor = "text-emerald-600";
      }
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-12 bg-indigo-50 border border-indigo-100 rounded-3xl min-h-[400px] shadow-sm w-full max-w-4xl mx-auto">
        <span className="text-6xl mb-4" aria-hidden="true">🎯</span>
        <h2 className="text-3xl font-black text-indigo-950 mb-2">Demo Complete</h2>
        <p className="text-lg text-slate-700 font-medium max-w-md mb-8 text-center">
          Your estimated score is <strong className="text-indigo-600 text-2xl">{score}</strong>. 
          <br/>
          <span className={`font-bold ${highlightColor}`}>{percentileMsg}</span>
        </p>

        <div className="w-full bg-white p-6 md:p-8 rounded-2xl border border-indigo-100 shadow-sm mb-8 text-left">
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center justify-center gap-2 text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Unlock 100% Free Access
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <span className="text-2xl mt-1" aria-hidden="true">🗺️</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">AI Study Planner</h3>
                <p className="text-xs text-slate-600 mt-1">Generate personalized, day-by-day tactical study plans.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <span className="text-2xl mt-1" aria-hidden="true">🎯</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Practice Hub</h3>
                <p className="text-xs text-slate-600 mt-1">Access thousands of PYQs and full-length CBT mocks.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <span className="text-2xl mt-1" aria-hidden="true">⚡</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Smart Booklets</h3>
                <p className="text-xs text-slate-600 mt-1">Memorize faster with daily interactive flashcards.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <span className="text-2xl mt-1" aria-hidden="true">🤖</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tactical AI Coach</h3>
                <p className="text-xs text-slate-600 mt-1">Instant performance breakdowns and targeted drills.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
             <p className="text-indigo-700 font-black text-sm uppercase tracking-wide">No credit card, no hidden fees to start.</p>
          </div>
        </div>
        
        <Link href="/login">
           <PrimaryButton className="px-8 py-4 text-lg bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all shadow-emerald-600/30 border-0">
             Create Your Free Account Now
           </PrimaryButton>
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const qId = currentQ.id;

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm lg:flex-row h-full min-h-[600px]">
      {/* Left panel: Question and Options */}
      <div className="flex flex-col flex-1 relative min-h-0 bg-white z-10 lg:order-1 order-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:px-8 border-b border-gray-100 bg-white z-20 pointer-events-auto">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
               {currentQuestionIndex + 1}
             </div>
             <span className="font-bold text-slate-800 hidden md:block">
               {currentQ.subject}
             </span>
             {currentQ.isPyq && (
                <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-800 rounded">PYQ</span>
             )}
           </div>
           
           {/* Mobile Clock */}
           <div className="lg:hidden pointer-events-none">
             <MemoizedTimer initialSeconds={timeRemainingRef.current} onTick={handleTick} onTimeUp={handleSubmit} />
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8 scroll-smooth pb-32 lg:pb-8 relative z-10">
           <div className="max-w-3xl mx-auto w-full">
             <div className="prose prose-slate max-w-none text-slate-800 text-lg md:text-xl font-medium mb-8 leading-relaxed">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                 {currentQ.text}
               </ReactMarkdown>
             </div>
             <div className="flex flex-col gap-4">
               {currentQ.options.map((opt, idx) => (
                 <OptionButton 
                   key={idx} 
                   optionText={opt} 
                   optionId={idx}
                   questionId={qId}
                   isSelected={selectedAnswers[qId] === idx} 
                   onSelect={selectOption} 
                 />
               ))}
             </div>
           </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-gray-100 z-50 sticky bottom-0 safe-bottom pointer-events-auto shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-2 md:gap-4">
             <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => clearResponse(qId)}
                  className="px-3 md:px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs md:text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Clear
                </button>
                <button 
                  type="button"
                  onClick={() => markForReviewAndNext(qId)}
                  className="px-3 md:px-4 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-bold text-xs md:text-sm hover:bg-indigo-50 transition-colors min-h-[44px] hidden sm:block"
                >
                  Mark & Next
                </button>
             </div>
             <div className="flex items-center gap-2">
               <button 
                  type="button"
                  onClick={() => markForReviewAndNext(qId)}
                  className="px-3 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-colors min-h-[44px] sm:hidden"
               >
                  Mark
               </button>
               <button 
                  type="button"
                  onClick={() => saveAndNext(qId)}
                  className="px-4 md:px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs md:text-sm hover:bg-indigo-700 hover:shadow-lg transition-all min-h-[44px]"
               >
                  Save & Next
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Right panel: Palette */}
      <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col min-h-0 lg:order-2 order-1 sticky top-0 z-40 pointer-events-auto">
         <div className="p-4 border-b border-gray-200 bg-white hidden lg:flex justify-between items-center">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">Time Left</span>
            {/* Desktop Clock */}
            <div className="pointer-events-none">
              <MemoizedTimer initialSeconds={timeRemainingRef.current} onTick={handleTick} onTimeUp={handleSubmit} />
            </div>
         </div>
         
         <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => (
                 <PaletteButton 
                   key={q.id}
                   number={idx + 1}
                   status={statuses[q.id] || "unvisited"}
                   isActive={currentQuestionIndex === idx}
                   onClick={() => paletteClick(idx)}
                 />
              ))}
            </div>
         </div>

         <div className="p-4 border-t border-gray-200 bg-white">
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
            >
               {isSubmitting ? "Submitting..." : "Submit Mock"}
            </button>
         </div>
      </div>
    </div>
  );
}

// Subcomponents for DemoTestRunner
const MemoizedTimer = memo(function MemoizedTimer({ initialSeconds, onTick, onTimeUp }: { initialSeconds: number, onTick: (s: number) => void, onTimeUp: () => void }) {
  return <MissionClock initialSeconds={initialSeconds} onTick={onTick} onTimeUp={onTimeUp} />;
});

const OptionButton = memo(function OptionButton({ optionText, optionId, questionId, isSelected, onSelect }: { optionText: string, optionId: number, questionId: string, isSelected: boolean, onSelect: (qId: string, optIdx: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(questionId, optionId)}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group min-h-[44px] active:scale-[0.98] ${
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

const PaletteButton = memo(function PaletteButton({ number, status, isActive, onClick }: { number: number, status: QStatus, isActive: boolean, onClick: () => void }) {
  let styleClass = "bg-slate-200 text-slate-700 rounded border border-slate-300";
  if (status === "unanswered") styleClass = "bg-red-500 text-white rounded-t-md shadow-sm";
  if (status === "answered") styleClass = "bg-green-600 text-white rounded-b-md shadow-sm";
  if (status === "marked") styleClass = "bg-purple-600 text-white rounded-full shadow-sm";
  if (status === "answered_and_marked") styleClass = "bg-purple-600 text-white rounded-full shadow-sm relative";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full aspect-square flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 active:scale-95 relative pointer-events-auto ${styleClass} ${isActive ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
    >
      {number}
      {status === "answered_and_marked" && (
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
      )}
    </button>
  );
});
