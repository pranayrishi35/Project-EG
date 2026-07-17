"use client";

import React from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import Link from "next/link";

export default function ConversionWall() {
  const { skip } = useOnboarding();

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">You crushed the trial!</h2>
        <p className="text-sm text-gray-600">
          Create a free account to save your progress and unlock the full power of ExamPilot.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
            <span>✓</span> What You Unlock
          </h3>
          <ul className="text-sm text-emerald-900 space-y-2 font-medium">
            <li>• Persistent daily streaks</li>
            <li>• AI Tactical Coaching</li>
            <li>• Exam percentile rankings</li>
            <li>• Personalized study plans</li>
          </ul>
        </div>

        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-3 flex items-center gap-2">
            <span>✗</span> What You Lose
          </h3>
          <ul className="text-sm text-red-900 space-y-2 font-medium">
            <li>• All trial performance data</li>
            <li>• Generated answers</li>
            <li>• Current session progress</li>
            <li className="font-bold text-red-600">(Wiped when tab closes)</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/signup"
          onClick={skip} // Reset onboarding state on click
          className="w-full h-11 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Create Free Account
        </Link>
        <button
          onClick={skip}
          className="w-full h-11 flex items-center justify-center bg-white text-gray-500 rounded-xl font-bold hover:text-gray-700 active:scale-95 transition-all"
        >
          Discard progress and exit
        </button>
      </div>
    </div>
  );
}
