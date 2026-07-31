import React from "react";
import type { Metadata } from "next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import OnboardingFunnel, { OnboardingQuestion } from "@/components/onboarding/OnboardingFunnel";
import { getDemoMockQuestions } from "@/app/actions/getDemoMock";

export const metadata: Metadata = {
  title: "Get Started with Your AI Study Planner | Jishnu",
  description:
    "Set up your study plan in a few quick steps: choose your defense exam (AFCAT, CDS, NDA), pick your daily study time, and try a sample question with instant AI feedback.",
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
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await Promise.race([fetchPromise, timeoutPromise]);
    if (res?.success && res?.questions && res.questions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialQuestions = res.questions.map((q: any) => ({
        id: q.id || "demo-db",
        question: q.question || q.text || "Where is the headquarters of the International Court of Justice located?",
        options: q.options || ["Geneva", "The Hague (Correct)", "New York", "Paris"],
        subject: q.subject || "Defense General Awareness & Polity",
        explanation: "Correct! The International Court of Justice (ICJ), the main judicial body of the United Nations, is based at the Peace Palace in The Hague, Netherlands. In the app, you get instant feedback like this on every practice question.",
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
