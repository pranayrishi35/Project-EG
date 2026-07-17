"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export enum OnboardingStep {
  IDLE = -1,
  WELCOME = 0,
  PRACTICE_HUB_TOUR = 1,
  MINI_TRIAL_TEST = 2,
  RESULTS_BREAKDOWN = 3,
  CONVERSION_WALL = 4,
}

interface OnboardingContextType {
  currentStep: OnboardingStep;
  isActive: boolean;
  start: () => void;
  next: () => void;
  skip: () => void;
  restart: () => void;
  setGuestCookie: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.IDLE);
  const router = useRouter();
  const pathname = usePathname();

  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("exampilot_onboarding_step");
    if (saved !== null) {
      setCurrentStep(parseInt(saved, 10));
    }
  }, []);

  // Save to session storage on change
  useEffect(() => {
    if (currentStep !== OnboardingStep.IDLE) {
      sessionStorage.setItem("exampilot_onboarding_step", currentStep.toString());
    } else {
      sessionStorage.removeItem("exampilot_onboarding_step");
    }
  }, [currentStep]);

  // Handle routing for specific steps
  useEffect(() => {
    if (currentStep === OnboardingStep.PRACTICE_HUB_TOUR && pathname !== "/practice") {
      router.push("/practice");
    }
  }, [currentStep, pathname, router]);

  const setGuestCookie = () => {
    document.cookie = "onboarding_guest=true; path=/; max-age=86400"; // 24 hours
  };

  const start = () => {
    setGuestCookie();
    setCurrentStep(OnboardingStep.WELCOME);
  };

  const next = () => {
    if (currentStep < OnboardingStep.CONVERSION_WALL) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const skip = () => {
    setCurrentStep(OnboardingStep.IDLE);
  };

  const restart = () => {
    setCurrentStep(OnboardingStep.WELCOME);
  };

  const isActive = currentStep !== OnboardingStep.IDLE;

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        isActive,
        start,
        next,
        skip,
        restart,
        setGuestCookie,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
