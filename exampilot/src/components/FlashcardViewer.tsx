"use client";

import { useState } from "react";
import Link from "next/link";
import type { Flashcard } from "@/app/actions/generateFlashcards";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  focusedSubjects?: string[];
}

export default function FlashcardViewer({ flashcards, focusedSubjects }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 150); // slight delay to allow flip animation to reset before changing content
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
          🔥
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Daily Practice Complete!</h1>
        <p className="text-slate-500 mb-8 font-medium">You smashed through 5 targeted questions today.</p>
        <Link href="/" className="ep-btn-primary w-full max-w-xs shadow-lg">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 safe-bottom animate-fade-in">
      
      {/* Header Info */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-slate-700 hover:text-slate-600 font-medium text-sm transition-colors">
            ← Back
          </Link>
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
            Card {currentIndex + 1} of {flashcards.length}
          </div>
        </div>
        
        {focusedSubjects && focusedSubjects.length > 0 && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl self-center w-full justify-center">
            <span className="text-sm">🎯</span>
            <span className="text-xs font-bold text-purple-700">Focused on: {focusedSubjects.join(", ")}</span>
          </div>
        )}
      </div>

      {/* 3D Flashcard Container */}
      <div className="w-full max-w-sm aspect-[4/5] [perspective:1000px]">
        <div 
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={handleFlip}
        >
          {/* Front (Question) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white border border-slate-200 rounded-3xl shadow-xl p-8 flex flex-col justify-center text-center">
            <span className="absolute top-6 left-6 text-2xl opacity-20">Q.</span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
              {currentCard?.question}
            </h2>
            <p className="absolute bottom-6 left-0 right-0 text-xs font-semibold text-indigo-400 uppercase tracking-widest animate-pulse">
              Tap to flip
            </p>
          </div>

          {/* Back (Answer) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-indigo-600 rounded-3xl shadow-xl p-8 flex flex-col justify-center text-center">
            <span className="absolute top-6 left-6 text-2xl text-white opacity-20">A.</span>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
              {currentCard?.answer}
            </h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-sm mt-10 flex gap-4">
        {!isFlipped ? (
          <button 
            onClick={handleFlip}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-95"
          >
            Show Answer
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-800/20 hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Next Card
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}
