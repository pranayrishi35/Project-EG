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
  "Mission Objective",
  "Diagnostic Sample",
  "Target Selection",
  "Velocity Calibration",
  "Syllabus Engine",
  "Telemetry HUD",
  "Tactical Roadmap",
  "Portal Launch",
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
  const trackFunnelEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    if (typeof window !== "undefined") {
      const payload = { event: eventName, timestamp: new Date().toISOString(), step: currentStep, stepTitle: STEP_TITLES[currentStep - 1], ...eventData };
      (window as any).dataLayer = (window as any).dataLayer || [];
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
              Jishnu <span className="text-brand-accent-500 font-normal text-sm ml-1">Flight Calibration</span>
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
                <p className="text-sm font-bold text-white">Welcome back, Pilot!</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  We detected an active session or previous calibration in your cockpit history. You can immediately enter your portal or re-run this walkthrough below.
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
                  <Compass size={14} /> System Initializer
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Initialize Your AI Study Flight Deck
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Prepare for military competitive selection with structured discipline and tactical pacing. In this quick 8-step calibration, we will tune your exam specifications and test our real-time diagnostic engine.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Layers size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Zero Manual Planning</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automatically converts complex exam syllabus PDF files into manageable daily study milestones.
                  </p>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-brand-accent-500 flex items-center justify-center">
                    <Terminal size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Instant Diagnostics</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evaluates mock responses instantaneously with deep conceptual reasoning and formula breakdown.
                  </p>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Gauge size={22} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Readiness Telemetry</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Monitors your pacing and flags weaker topics for automatic spaced-repetition reinforcements.
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
                  <Zap size={14} /> Live Engine Simulation
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Test Your AI Diagnostic Engine
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Before setting your schedule, test our instant diagnostic telemetry. Answer this live sample check from our question bank below:
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="font-mono text-amber-400 font-bold">{question.subject || "Defense General Knowledge"}</span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">Live Sample</span>
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
                      <Sparkles size={16} /> Diagnostic Telemetry Explanation:
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
                  <Target size={14} /> Target Acquisition
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Select Your Mission Target
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Identify your upcoming competitive military selection examination to tune all practice syllabi and mock test parameters accordingly:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { id: "AFCAT", title: "AFCAT", desc: "Air Force Common Admission Test — Flying, Technical & Ground Duty Branches." },
                  { id: "CDS", title: "CDS Exam", desc: "Combined Defence Services — Indian Military, Naval, and Air Force Academies." },
                  { id: "NDA", title: "NDA & NA", desc: "National Defence Academy & Naval Academy Examination entry track." },
                  { id: "CUSTOM", title: "Custom Defense Syllabus", desc: "Upload any specialized official notification PDF for direct AI parsing and schedule mapping." },
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
                        {active ? "Target Locked" : "Click to select"}
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
                  <Clock size={14} /> Velocity Calibration
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Calibrate Daily Study Velocity
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Consistent daily execution beats sporadic cramming sessions. Select a realistic preparation velocity to scale your daily topic checklists:
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { id: "30m", time: "30 Minutes / Day", badge: "Steady Recon", desc: "Optimal for students with heavy academic coursework or active duties. Covers 2 focused topics plus daily current affairs review." },
                  { id: "60m", time: "60 Minutes / Day", badge: "Standard Pacing", desc: "Recommended balanced trajectory. Complete concept breakdowns, 15 practice drills, and daily vocabulary retention sessions." },
                  { id: "120m", time: "120+ Minutes / Day", badge: "Intense Sprint", desc: "High-velocity immersion designed for upcoming examination deadlines. Intensive timed problem sets and daily sectional mocks." },
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
                  <Sparkles size={14} /> Autonomous Ingestion
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  AI Syllabus Ingestion Engine
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  When you upload official exam circulars or select standard defense packages, Gemini AI ingests and breaks down the syllabus into modular milestones:
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-3 font-sans">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Terminal size={16} className="text-brand-accent-500" /> Syllabus Parser Simulation: <span className="text-amber-400 font-mono">{selectedExam}</span> <span className="text-[11px] text-slate-400 font-normal italic ml-1">(Illustrative Schedule)</span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase text-[11px]">Ready</span>
                </div>

                <div className="space-y-2 pt-1 text-slate-300 font-mono">
                  <p className="flex items-center gap-2 text-emerald-400">
                    <Check size={14} /> [SUCCESS] Ingested 4 Primary Sectional Pillars for {selectedExam}
                  </p>
                  <div className="pl-5 space-y-1 text-slate-300">
                    <p>&bull; General Awareness (Defense Current Affairs, Strategic Geography, Indian Polity)</p>
                    <p>&bull; Verbal Ability in English (Comprehension, Vocabulary, Error Recognition)</p>
                    <p>&bull; Numerical Ability (Decimal Fraction, Time &amp; Distance, Percentage, Ratio)</p>
                    <p>&bull; Reasoning and Military Aptitude (Spatial Orientation, Venn Diagrams)</p>
                  </div>
                  <p className="flex items-center gap-2 text-brand-accent-500 pt-2">
                    <Check size={14} /> [CALCULATED] 84 High-Yield Conceptual Modules scheduled at {studyDuration}/day velocity.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
                <Shield size={20} className="text-emerald-400 shrink-0" />
                <span>Every topic is continuously updated against recent PYQ frequency trends from the past 5 examination years. Module allocation adjusts after your initial diagnostic drill.</span>
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
                  <Gauge size={14} /> Readiness Telemetry Demo
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Real-Time Combat Readiness HUD
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Here is a live working demonstration of the telemetry you will unlock in your command center after completing your initial practice drills:
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-blue-300">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles size={16} className="text-blue-400 shrink-0" />
                  Illustrative Pilot Sample Telemetry &mdash; Values calibrate after your first completed drill.
                </span>
                <span className="font-mono uppercase text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">Demo Mode</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mission Accuracy</span>
                  <div className="mt-3 text-3xl font-black text-emerald-400">88.4%</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example: Pacing above threshold</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Weakness</span>
                  <div className="mt-3 text-lg font-bold text-amber-400 truncate">Spatial Aptitude</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example: Auto-scheduled drill</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projected Rank</span>
                  <div className="mt-3 text-2xl font-black text-purple-400">Top 5%</div>
                  <span className="text-[11px] text-slate-400 mt-2 italic">Example: National modeling</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-brand-accent-500" /> Automatic Spaced-Repetition Decks
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Any mock question answered incorrectly is immediately transmuted into high-yield review flashcards for daily maintenance.
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
                  <Layers size={14} /> Tactical Roadmap
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Your Personalized Flight Plan
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Based on your selection of <span className="text-amber-400 font-bold">{selectedExam}</span> at <span className="text-emerald-400 font-bold">{studyDuration}/day</span> velocity, here is your foundational 4-week preparation trajectory:
                </p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 pl-8">
                {[
                  { week: "Week 1", title: "Baseline Diagnostics & Core Foundations", desc: "Complete diagnostic practice test; calibrate syllabus baseline and commence high-yield static awareness concepts." },
                  { week: "Week 2", title: "Intensive Sectional Drills & Velocity Training", desc: "Targeted numerical problem sets, English vocabulary assimilation, and reasoned spatial puzzles under strict timer limits." },
                  { week: "Week 3", title: "Full-Length Combat Simulation & Weakness Triage", desc: "Execute timed mock trials replicating real examination center constraints and stress factors." },
                  { week: "Week 4", title: "Peak Readiness Polish & Final Revision Sprints", desc: "Spaced-repetition card sweeps, rapid formulas recall, and high-confidence revision before examination deployment." },
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
                  <Rocket size={14} /> Cockpit Launch Ready
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  All Systems Operational: Launch Portal
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Your study flight deck parameters are locked in. Attach this mission configuration to your account to begin your daily preparation trajectory.
                </p>
              </div>

              {/* Summary Configuration Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 text-left shadow-inner">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Mission Configuration Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Target Exam:</span>
                    <span className="text-base sm:text-lg font-black text-white">{selectedExam}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Daily Velocity:</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">{studyDuration} / Day</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-400 block">System Status:</span>
                    <span className="text-base sm:text-lg font-black text-brand-accent-500 flex items-center gap-1.5">
                      <CheckCircle2 size={18} /> Operational
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
                    <span>Create Free Account &amp; Launch</span>
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
                    <span>Explore cockpit immediately in temporary guest preview</span>
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
