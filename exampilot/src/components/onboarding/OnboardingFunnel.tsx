"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket,
  Shield,
  Target,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Award,
  Sparkles,
  BookOpen,
  Terminal,
  Layers,
  Gauge,
  UserCheck,
  Compass,
  Zap,
  Check,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  HelpCircle,
} from "lucide-react";

export interface OnboardingQuestion {
  id: string;
  question: string;
  options: string[];
  subject?: string;
  text?: string;
  explanation?: string;
}

export interface OnboardingFunnelProps {
  isReturningUser: boolean;
  initialQuestions?: OnboardingQuestion[];
}

const FALLBACK_QUESTION: OnboardingQuestion = {
  id: "demo-q1",
  subject: "AFCAT Aerodynamic Logic & Theory",
  question: "During high-speed maneuvering, lift generated across a supersonic fighter aircraft wing is primarily proportional to:",
  options: [
    "A) The ambient atmospheric temperature around the fuselage",
    "B) The aerodynamic pressure difference between upper and lower airfoil surfaces (Correct)",
    "C) Total engine afterburner thrust output directly",
    "D) The structural weight and density of wing composites",
  ],
  explanation:
    "Correct! Aerodynamic lift directly relates to Bernoulli's principle and airflow deflection, creating high dynamic pressure below the airfoil and low static pressure across the cambered upper surface.",
};

const STEP_TITLES = [
  "Welcome",
  "Try a Sample Question",
  "Choose Your Exam",
  "Daily Study Time",
  "How the Plan Is Built",
  "What You'll Track",
  "Your 4-Week Plan",
  "Create Your Account",
];

export default function OnboardingFunnel({
  isReturningUser,
  initialQuestions = [],
}: OnboardingFunnelProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedExam, setSelectedExam] = useState<string>("AFCAT");
  const [studyDuration, setStudyDuration] = useState<string>("60m");
  
  // Step 2 Question handling
  const question: OnboardingQuestion = initialQuestions.length > 0 ? initialQuestions[0] : FALLBACK_QUESTION;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [demoSubmitted, setDemoSubmitted] = useState<boolean>(false);

  // Structured analytics telemetry dispatch hook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trackFunnelEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    if (typeof window !== "undefined") {
      const payload = { event: eventName, timestamp: new Date().toISOString(), step: currentStep, stepTitle: STEP_TITLES[currentStep - 1], ...eventData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).dataLayer = (window as any).dataLayer || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).dataLayer.push(payload);
      window.dispatchEvent(new CustomEvent("exampilot:analytics", { detail: payload }));
    }
  };

  // Dispatch initialization telemetry on mount
  useEffect(() => {
    trackFunnelEvent("onboarding_initialized", { isReturningUser });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark completion cookie when entering step 8 & emit event
  useEffect(() => {
    if (currentStep === 8 && typeof document !== "undefined") {
      document.cookie = "onboarding_completed=true; path=/; max-age=" + (60 * 60 * 24 * 365);
      try {
        localStorage.setItem("ep_target_exam", selectedExam);
        localStorage.setItem("ep_study_velocity", studyDuration);
      } catch {
        // Ignore localStorage quota or private window restrictions
      }
      trackFunnelEvent("onboarding_completed", { targetExam: selectedExam, studyVelocity: studyDuration });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedExam, studyDuration]);

  const handleNext = () => {
    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      trackFunnelEvent("step_transition", { fromStep: currentStep, toStep: nextStep, nextTitle: STEP_TITLES[nextStep - 1] });
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      trackFunnelEvent("step_transition_back", { fromStep: currentStep, toStep: prevStep });
      setCurrentStep(prevStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOptionSelect = (index: number) => {
    if (!demoSubmitted) {
      setSelectedOptionIdx(index);
      setDemoSubmitted(true);
      trackFunnelEvent("diagnostic_option_selected", { questionId: question.id, selectedOption: index });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-canvas text-brand-ink-inverse font-sans antialiased pb-24 selection:bg-brand-accent-500 selection:text-brand-ink-primary overflow-x-hidden">
      {/* ── Top Navigation & Branding ── */}
      <header className="sticky top-0 z-40 bg-brand-bg-canvas/90 backdrop-blur-md border-b border-brand-border-subtle/20 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-bg-elevated flex items-center justify-center border border-brand-accent-500/30 text-brand-accent-500 shadow-sm">
              <Rocket size={20} className="stroke-[2.2]" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Jishnu <span className="text-brand-accent-500 font-normal text-sm ml-1">Getting Started</span>
            </span>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-bg-elevated border border-brand-border-subtle/30 text-brand-ink-muted">
            Step {currentStep} of 8: <span className="text-brand-accent-500 font-bold">{STEP_TITLES[currentStep - 1]}</span>
          </div>
        </div>

        {/* ── Visual Progress Bar ── */}
        <div className="max-w-4xl mx-auto mt-3 bg-slate-800/60 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / 8) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={8}
          />
        </div>
      </header>

      {/* ── Returning-User Detection Alert Banner ── */}
      {isReturningUser && (
        <div className="max-w-4xl mx-auto mt-4 px-4 sm:px-6 animate-fade-in" id="returning-user-banner">
          <div className="bg-brand-bg-elevated border-l-4 border-l-brand-accent-500 border border-brand-border-subtle/40 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-brand-accent-500 shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Welcome back!</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Looks like you've been here before. You can go straight to your dashboard, or walk through this setup again below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Link
                href="/"
                className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
              >
                Skip to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Step Content Carousel ── */}
      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        <div 
          key={`step-${currentStep}`} 
          data-testid={`onboarding-step-${currentStep}`} 
          className="bg-brand-bg-elevated border border-brand-border-subtle/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300"
        >
          {/* Decorative ambient background ring */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-accent-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          {/* ─────────────────────────────────────────────────────────────────
              STEP 1: WELCOME & MISSION OBJECTIVE
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div id="step-1" className="space-y-8 animate-fade-in">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-brand-accent-500 border border-amber-500/25">
                  <Compass size={14} /> Getting Started
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Welcome to Your AI Study Planner
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Get ready for your defense exam with a personalized day-by-day study plan. This quick 8-step setup will customize your exam preparation and show you how our AI works.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Layers size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Automatic Planning</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upload your exam syllabus PDF and get a complete day-by-day study schedule instantly.
                  </p>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-brand-accent-500 flex items-center justify-center">
                    <Terminal size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Instant Feedback</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Get detailed explanations for every practice question, with step-by-step reasoning.
                  </p>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Gauge size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Progress Tracking</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Track your progress daily and see which topics need more practice with spaced repetition.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 2: INTERACTIVE DIAGNOSTIC SAMPLE (DEMO MOCK REPLACEMENT)
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div id="step-2" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Zap size={14} /> Try It Out
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Try a Sample Question
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Before we build your study plan, try out our instant AI feedback. Answer this sample question from our question bank:
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="font-mono text-amber-400 font-bold">{question.subject || "Defense General Knowledge"}</span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">Sample Question</span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  {question.question || question.text || "Where is the headquarters of the International Court of Justice located?"}
                </p>
                
                <div className="space-y-2.5">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOptionIdx === idx;
                    const isAnswerCorrect = opt.includes("(Correct)") || opt.toLowerCase().includes("hague") || opt.toLowerCase().includes("pressure difference") || idx === 1;
                    
                    let btnStyle = "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700";
                    if (demoSubmitted && isSelected) {
                      btnStyle = isAnswerCorrect
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10"
                        : "bg-red-500/20 text-red-300 border-red-500";
                    } else if (demoSubmitted && isAnswerCorrect) {
                      btnStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/50";
                    }

                    return (
                      <button
                        key={idx}
                        id={`option-${idx}`}
                        type="button"
                        onClick={() => handleOptionSelect(idx)}
                        disabled={demoSubmitted}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {demoSubmitted && isAnswerCorrect && (
                          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {demoSubmitted && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-amber-500/40 text-xs sm:text-sm text-slate-200 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <Sparkles size={16} /> Explanation:
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {question.explanation || "Lift is generated primarily via aerodynamic pressure differentiation according to Bernoulli's Principle, where airspeed above the cambered wing exceeds below wing velocity, creating an upward dynamic pressure differential."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 3: TARGET EXAM SELECTION
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div id="step-3" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  <Target size={14} /> Choose Your Exam
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Which Exam Are You Preparing For?
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Pick your exam so we can build your study plan and practice tests around the right syllabus:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { id: "AFCAT", title: "AFCAT", desc: "Air Force Common Admission Test — Flying, Technical & Ground Duty Branches." },
                  { id: "CDS", title: "CDS Exam", desc: "Combined Defence Services — Indian Military, Naval, and Air Force Academies." },
                  { id: "NDA", title: "NDA & NA", desc: "National Defence Academy & Naval Academy Examination entry track." },
                  { id: "CUSTOM", title: "Other / Custom", desc: "Upload any official exam notification PDF and we'll build a study plan from it." },
                ].map((item) => {
                  const active = selectedExam === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`target-${item.id}`}
                      type="button"
                      onClick={() => setSelectedExam(item.id)}
                      className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between h-40 ${
                        active
                          ? "bg-amber-500/15 border-brand-accent-500 shadow-lg shadow-amber-500/10 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base text-white">{item.title}</span>
                          {active && (
                            <div className="w-6 h-6 rounded-full bg-brand-accent-500 text-slate-900 flex items-center justify-center font-bold">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                      </div>
                      <span className={`text-[11px] font-bold tracking-wider uppercase mt-3 ${active ? "text-brand-accent-500" : "text-slate-500"}`}>
                        {active ? "Selected" : "Tap to select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 4: DAILY PREPARATION STRATEGY & TIME TARGET
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div id="step-4" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Clock size={14} /> Daily Study Time
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  How Much Time Can You Study Each Day?
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Pick a realistic daily study time. We'll build your plan around it so you can stay consistent:
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { id: "30m", time: "30 Minutes / Day", badge: "Light Pace", desc: "Good for students with a full schedule or other commitments. Covers 2 focused topics plus daily current affairs." },
                  { id: "60m", time: "60 Minutes / Day", badge: "Balanced", desc: "Recommended for most students. Complete concept lessons, 15 practice questions, and daily vocabulary review." },
                  { id: "120m", time: "2+ Hours / Day", badge: "Intensive", desc: "For students with an exam coming soon. Includes timed problem sets and daily practice tests." },
                ].map((velo) => {
                  const active = studyDuration === velo.id;
                  return (
                    <button
                      key={velo.id}
                      id={`velocity-${velo.id}`}
                      type="button"
                      onClick={() => setStudyDuration(velo.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex sm:items-center justify-between flex-col sm:flex-row gap-4 ${
                        active
                          ? "bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="space-y-1.5 max-w-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-base">{velo.time}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${active ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-300"}`}>
                            {velo.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{velo.desc}</p>
                      </div>
                      <div className="shrink-0 flex items-center justify-end sm:justify-center">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${active ? "border-emerald-500 bg-emerald-500 text-slate-900" : "border-slate-700 bg-slate-800"}`}>
                          {active && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 5: SYLLABUS AI MAPPING DEMONSTRATION
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 5 && (
            <div id="step-5" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-brand-accent-500 border border-amber-500/25">
                  <Sparkles size={14} /> How It Works
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  How Your Study Plan Is Built
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  When you upload an official exam notification or pick a standard exam, our AI reads the syllabus and breaks it into daily study targets:
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-3 font-sans">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Terminal size={16} className="text-brand-accent-500" /> Syllabus breakdown: <span className="text-amber-400 font-mono">{selectedExam}</span> <span className="text-[11px] text-slate-400 font-normal italic ml-1">(Illustrative Schedule)</span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase text-[11px]">Ready</span>
                </div>

                <div className="space-y-2 pt-1 text-slate-300 font-mono">
                  <p className="flex items-center gap-2 text-emerald-400">
                    <Check size={14} /> Found 4 main sections for {selectedExam}
                  </p>
                  <div className="pl-5 space-y-1 text-slate-300">
                    <p>&bull; General Awareness (Defense Current Affairs, Strategic Geography, Indian Polity)</p>
                    <p>&bull; Verbal Ability in English (Comprehension, Vocabulary, Error Recognition)</p>
                    <p>&bull; Numerical Ability (Decimal Fraction, Time &amp; Distance, Percentage, Ratio)</p>
                    <p>&bull; Reasoning and Military Aptitude (Spatial Orientation, Venn Diagrams)</p>
                  </div>
                  <p className="flex items-center gap-2 text-brand-accent-500 pt-2">
                    <Check size={14} /> Created 84 study topics, scheduled for {studyDuration}/day.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
                <Shield size={20} className="text-emerald-400 shrink-0" />
                <span>Topics are prioritized using question trends from the last 5 years of past papers. Your plan adjusts after your first practice test.</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 6: DIAGNOSTIC SCORING ANALYSIS & READINESS TELEMETRY
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 6 && (
            <div id="step-6" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Gauge size={14} /> Your Dashboard
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  What You'll Track
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Here's a preview of the progress stats you'll see on your dashboard after you complete a few practice tests:
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-blue-300">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles size={16} className="text-blue-400 shrink-0" />
                  Sample numbers for illustration only &mdash; your real stats appear after your first practice test.
                </span>
                <span className="font-mono uppercase text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">Demo Mode</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
                  <div className="mt-3 text-3xl font-black text-emerald-400">88.4%</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example only</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Weakest Topic</span>
                  <div className="mt-3 text-lg font-bold text-amber-400 truncate">Spatial Reasoning</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example only</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Rank</span>
                  <div className="mt-3 text-2xl font-black text-purple-400">Top 5%</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example only</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-brand-accent-500" /> Automatic Revision Flashcards
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Any practice question you get wrong is automatically turned into a flashcard, so you can review it later.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-400 shrink-0">
                  Active Sync
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 7: PERSONALIZED STUDY FLIGHT DECK ROADMAP
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 7 && (
            <div id="step-7" className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Layers size={14} /> Your Plan
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Your First 4 Weeks
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  Based on <span className="text-amber-400 font-bold">{selectedExam}</span> at <span className="text-emerald-400 font-bold">{studyDuration}/day</span>, here's how your first 4 weeks of study will be organized:
                </p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 pl-8">
                {[
                  { week: "Week 1", title: "Starting Test & Basics", desc: "Take a starting practice test to find your level, then begin the most important general knowledge topics." },
                  { week: "Week 2", title: "Topic Practice & Timing", desc: "Practice math problems, build English vocabulary, and solve reasoning puzzles under a timer." },
                  { week: "Week 3", title: "Full Practice Tests", desc: "Take full-length timed practice tests that match the real exam, and focus on your weak areas." },
                  { week: "Week 4", title: "Final Revision", desc: "Review your flashcards, practice recalling formulas quickly, and do final revision before the exam." },
                ].map((phase, idx) => (
                  <div key={idx} className="relative bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1.5">
                    <div className="absolute -left-[31px] top-5 w-7 h-7 rounded-full bg-slate-900 border-2 border-brand-accent-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-brand-accent-500 tracking-wide">{phase.week}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">Scheduled</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{phase.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{phase.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              STEP 8: FINAL PORTAL LAUNCH
             ───────────────────────────────────────────────────────────────── */}
          {currentStep === 8 && (
            <div id="step-8" className="space-y-8 animate-fade-in text-center sm:text-left">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-brand-accent-500 border border-amber-500/25">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  <Rocket size={14} /> You're All Set
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  You're Ready to Start
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Your study preferences are set. Create a free account to save them and start your daily study plan.
                </p>
              </div>

              {/* Summary Configuration Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 text-left shadow-inner">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Your Setup Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Your Exam:</span>
                    <span className="text-base sm:text-lg font-black text-white">{selectedExam}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Daily Study Time:</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">{studyDuration} / Day</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-400 block">Status:</span>
                    <span className="text-base sm:text-lg font-black text-brand-accent-500 flex items-center gap-1.5">
                      <CheckCircle2 size={18} /> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Launch Buttons */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    id="btn-create-account"
                    href={`/login?target=${selectedExam}&duration=${studyDuration}&mode=register`}
                    className="w-full text-center py-4 px-6 rounded-xl bg-brand-accent-500 hover:bg-brand-accent-600 text-brand-ink-primary font-black text-sm sm:text-base transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span>Create Free Account &amp; Start</span>
                    <Rocket size={18} />
                  </Link>
                  <Link
                    id="btn-sign-in"
                    href={`/login?target=${selectedExam}&duration=${studyDuration}`}
                    className="w-full text-center py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span>Sign In to Existing Account</span>
                  </Link>
                </div>
                
                <div className="pt-3 text-center">
                  <Link
                    id="btn-launch-guest"
                    href="/"
                    className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <span>Just look around first as a guest</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              BOTTOM STEP CONTROLS (NEXT / PREV BUTTONS)
             ───────────────────────────────────────────────────────────────── */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                id="btn-prev-step"
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm transition-colors border border-slate-700 flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Previous Step</span>
              </button>
            ) : (
              <div /> // Placeholder to keep Next button aligned right
            )}

            {currentStep < 8 && (
              <button
                id="btn-next-step"
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-brand-accent-500 hover:bg-brand-accent-600 text-brand-ink-primary font-bold text-xs sm:text-sm transition-all shadow-md shadow-brand-accent-500/20 flex items-center gap-2 active:scale-[0.98]"
              >
                <span>Proceed to {STEP_TITLES[currentStep]}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
