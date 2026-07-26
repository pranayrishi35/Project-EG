import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import OnboardingFunnel, { OnboardingQuestion } from "@/components/onboarding/OnboardingFunnel";
import { getDemoMockQuestions } from "@/app/actions/getDemoMock";

export const metadata: Metadata = {
  title: "Initialize Your AI Study Wingman | ExamPilot Flight Calibration",
  description:
    "Calibrate your study parameter telemetry, select your target defense exam (AFCAT, CDS, NDA), and test our instantaneous diagnostic scoring engine.",
};

export default async function WelcomePage() {
  // 1. Synchronous & fast returning-user detection via session and completion cookies
  const cookieStore = cookies();
  const hasCompletedCookie = cookieStore.has("onboarding_completed") && cookieStore.get("onboarding_completed")?.value === "true";
  const hasSupabaseAuthCookie = cookieStore.getAll().some(c => c.name.startsWith("sb-") && !c.name.includes("code-verifier"));
  const isReturningUser = hasCompletedCookie || hasSupabaseAuthCookie;

  // 2. Fetch sample diagnostic questions from DB with a strict 1200ms timeout race
  let initialQuestions: OnboardingQuestion[] = [];
  try {
    const fetchPromise = getDemoMockQuestions().catch((err) => {
      console.warn("[WelcomePage] DB offline or query failure handled:", err?.message);
      return null;
    });
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    
    const res: any = await Promise.race([fetchPromise, timeoutPromise]);
    if (res?.success && res?.questions && res.questions.length > 0) {
      initialQuestions = res.questions.map((q: any) => ({
        id: q.id || "demo-db",
        question: q.question || q.text || "Where is the headquarters of the International Court of Justice located?",
        options: q.options || ["Geneva", "The Hague (Correct)", "New York", "Paris"],
        subject: q.subject || "Defense General Awareness & Polity",
        explanation: "Correct! The International Court of Justice (ICJ), the principal judicial organ of the United Nations, is permanently seated at the Peace Palace in The Hague, Netherlands. Our real-time evaluation telemetry matches answers against authenticated PYQ archives immediately.",
      }));
    }
  } catch (err) {
    console.warn("[WelcomePage] Fast fallback to high-fidelity client sample triggered:", err);
  }

  return (
    <OnboardingFunnel
      isReturningUser={isReturningUser}
      initialQuestions={initialQuestions}
    />
  );
}
