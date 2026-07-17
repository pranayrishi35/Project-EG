"use client";

import React from "react";
import { useOnboarding } from "@/context/OnboardingContext";

export default function OnboardingTrigger() {
  const { start } = useOnboarding();

  return (
    <button
      onClick={start}
      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-black rounded-xl text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors active:scale-95 shadow-sm"
    >
      Try for Free
    </button>
  );
}
