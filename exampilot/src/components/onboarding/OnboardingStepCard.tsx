"use client";

import React from "react";
import { useOnboarding } from "@/context/OnboardingContext";

export default function OnboardingStepCard({
  title,
  description,
  buttonText
}: {
  title: string;
  description: string;
  buttonText: string;
}) {
  const { next, skip, currentStep } = useOnboarding();

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full ${
                step === currentStep ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-8 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={next}
          className="w-full h-11 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {buttonText}
        </button>
        <button
          onClick={skip}
          className="w-full h-11 flex items-center justify-center bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-gray-100 active:scale-95 transition-all"
        >
          Skip Tour
        </button>
      </div>
    </div>
  );
}
