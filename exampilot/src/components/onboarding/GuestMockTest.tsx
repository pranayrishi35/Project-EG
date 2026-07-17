"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";

const MOCK_QUESTIONS = [
  {
    question: "What is the primary role of the Indian Air Force?",
    options: ["Naval Warfare", "Aerial Warfare", "Border Security", "Cyber Defense"],
    answer: 1,
  },
  {
    question: "Which of these aircraft is a multirole combat fighter jet?",
    options: ["C-17 Globemaster", "Apache AH-64", "Dassault Rafale", "P-8I Neptune"],
    answer: 2,
  },
  {
    question: "Where is the Indian Military Academy located?",
    options: ["Pune", "Dehradun", "Khadakwasla", "Chennai"],
    answer: 1,
  }
];

export default function GuestMockTest() {
  const { next } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedOption !== null) {
      if (currentIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        next();
      }
    }
  };

  const currentQ = MOCK_QUESTIONS[currentIndex];

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Mini-Trial Mock</h2>
        <span className="text-xs font-bold text-gray-400">Q {currentIndex + 1} of {MOCK_QUESTIONS.length}</span>
      </div>

      <p className="text-lg font-bold text-gray-900 mb-6">
        {currentQ.question}
      </p>

      <div className="flex flex-col gap-3 mb-8">
        {currentQ.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedOption(idx)}
            className={`w-full min-h-[44px] px-4 py-3 text-left rounded-xl border-2 transition-all font-medium ${
              selectedOption === idx 
                ? "border-indigo-600 bg-indigo-50 text-indigo-900" 
                : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={selectedOption === null}
        className="w-full h-11 flex items-center justify-center bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all"
      >
        {currentIndex === MOCK_QUESTIONS.length - 1 ? "Submit Test" : "Next Question"}
      </button>
    </div>
  );
}
