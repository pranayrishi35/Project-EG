"use client";

import React from "react";
import { useOnboarding, OnboardingStep } from "@/context/OnboardingContext";
import OnboardingStepCard from "./OnboardingStepCard";
import GuestMockTest from "./GuestMockTest";
import ConversionWall from "./ConversionWall";
import { createPortal } from "react-dom";

export default function OnboardingOverlay() {
  const { currentStep, isActive } = useOnboarding();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isActive) return null;

  // The overlay is rendered in a portal so it sits above everything
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md">
        {currentStep === OnboardingStep.WELCOME && (
          <OnboardingStepCard
            title="Welcome to ExamPilot"
            description="Experience the future of AI-powered defense exam preparation. Let us show you how we can boost your score in just 3 minutes."
            buttonText="Start Tour"
          />
        )}
        
        {currentStep === OnboardingStep.PRACTICE_HUB_TOUR && (
          <OnboardingStepCard
            title="Practice Hub"
            description="This is your command center. Here you can track your performance, take full mock tests, and review daily flashcards."
            buttonText="Try a Mini-Mock"
          />
        )}

        {currentStep === OnboardingStep.MINI_TRIAL_TEST && (
          <GuestMockTest />
        )}

        {currentStep === OnboardingStep.RESULTS_BREAKDOWN && (
          <OnboardingStepCard
            title="AI Performance Breakdown"
            description="Our Tactical Coach analyzes your answers instantly, identifying your weak spots and suggesting targeted drills."
            buttonText="Unlock Full Analysis"
          />
        )}

        {currentStep === OnboardingStep.CONVERSION_WALL && (
          <ConversionWall />
        )}
      </div>
    </div>,
    document.body
  );
}
