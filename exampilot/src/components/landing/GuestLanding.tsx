import type { ReactNode } from "react";
import Link from "next/link";
import {
  Route, FileCheck2, Zap, Plane, Newspaper, BookOpen, ArrowRight,
  UploadCloud, CalendarRange, Target, Shield, CheckCircle2, Award,
  Activity, Gauge, BarChart3, Clock, Sparkles, type LucideIcon,
} from "lucide-react";

import { Section, Container } from "@/components/ui/Layout";
import { Badge } from "@/components/ui/Badge";
import { FeatureCard } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";
import MarketingNav from "@/components/landing/MarketingNav";
import MarketingFooter from "@/components/landing/MarketingFooter";
import Hero3D from "@/components/landing/Hero3D";

/**
 * GuestLanding — Logged-out marketing landing surface (Master Prompt v5).
 *
 * Implements a cohesive Aviation Flight Deck / Mission Control metaphor throughout,
 * plain-language accessibility for first-time aspirants and families, and replaces
 * the embedded demo testing widget with an interactive-feeling Mission Control preview
 * that guides visitors to the dedicated onboarding walkthrough (/welcome).
 */

export interface GuestLandingProps {
  spotlightSlot?: ReactNode;
  demoSlot?: ReactNode; // Kept optional for backward compatibility during staging transitions
}

const FEATURES: { icon: LucideIcon; title: string; summary: string; detail: string }[] = [
  { 
    icon: Route, 
    title: "AI daily study schedule", 
    summary: "Day-by-day preparation targets from your official syllabus.", 
    detail: "Google Gemini AI creates a tailored week-by-week roadmap leading directly to your exam day, breaking complex chapters into daily manageable checklists you can tick off." 
  },
  { 
    icon: FileCheck2, 
    title: "Timed practice tests (CBT)", 
    summary: "Computer-Based Test interface with real-time analytics.", 
    detail: "Practice with the exact online timing, question navigation, and negative marking rules you will encounter in the actual official examination." 
  },
  { 
    icon: Zap, 
    title: "Daily revision flashcards", 
    summary: "Smart memory repetition for high-yield facts & formulas.", 
    detail: "A fresh digital deck automatically prioritizes vital concepts, vocabulary, and formulas each morning without manual deck sorting." 
  },
  { 
    icon: Plane, 
    title: "Tejas AI wingman", 
    summary: "Your 24/7 personal study coach and academic navigator.", 
    detail: "Ask Tejas to simplify challenging theories in plain language, quiz your retention, or instantly rebalance your schedule when life gets in the way." 
  },
  { 
    icon: Newspaper, 
    title: "Defense news & GK updates", 
    summary: "Curated military affairs and general knowledge briefings.", 
    detail: "Concise daily summaries of national defense developments, joint exercises, and current events to ensure top marks in General Awareness." 
  },
  { 
    icon: BookOpen, 
    title: "Focused topic booklets", 
    summary: "Compact exam revision notes for high-weightage subjects.", 
    detail: "Targeted digital study booklets designed to strengthen complex analytical reasoning and quantitative chapters between timed practice sessions." 
  },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { 
    icon: UploadCloud, 
    title: "1. Upload your target syllabus", 
    body: "Select your chosen exam and targeted test date. Our AI system calibrates the exact syllabus requirements automatically with zero manual tedious setup." 
  },
  { 
    icon: CalendarRange, 
    title: "2. Receive your dynamic daily timeline", 
    body: "Google Gemini AI evaluates high-yield subject topic weightages to generate a realistic, tailored preparation timeline that adjusts to your personal study speed." 
  },
  { 
    icon: Target, 
    title: "3. Practice, refine, and track milestones", 
    body: "Complete interactive practice tests, review weak zones with spaced flashcards, and watch your predictive mission accuracy climb toward exam readiness." 
  },
];

const ctaPrimary =
  "inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl text-base font-bold bg-brand-accent-500 text-brand-accent-ink hover:bg-brand-accent-400 transition-all duration-base ease-standard shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400 focus-visible:ring-offset-2 active:scale-[0.98]";

const ctaSecondaryDark =
  "inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl text-base font-bold bg-slate-900 border border-brand-ink-inverse/20 text-brand-ink-inverse hover:border-brand-ink-inverse/50 hover:bg-slate-800/80 transition-all duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400 active:scale-[0.98]";

export default function GuestLanding({ spotlightSlot }: GuestLandingProps) {
  return (
    <div className="bg-brand-bg-canvas overflow-x-hidden w-full text-brand-ink-inverse selection:bg-brand-accent-500/30 selection:text-brand-accent-500">
      <MarketingNav />

      {/* ── 1. Hero Module (Flight Deck Mission Control) ───────────────── */}
      <section className="bg-brand-bg-canvas pt-[72px] overflow-x-hidden w-full relative snap-start">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-tr from-brand-accent-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 grid gap-12 lg:grid-cols-2 lg:items-center relative z-10">
          <div className="flex flex-col gap-6">
            <Reveal>
              <Badge variant="accent" className="whitespace-normal break-words h-auto max-w-full leading-relaxed px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-accent-500/15 text-brand-accent-500 border border-brand-accent-500/30 shadow-inner">
                For Air Force (AFCAT) · Army & Navy (CDS) · NDA Aspirants
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display font-bold text-display-xl tracking-tight text-brand-ink-inverse leading-[1.1]" style={{ maxWidth: "20ch" }}>
                Clear your defense exams with an{" "}
                <span className="text-brand-accent-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">AI study wingman.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-body-lg text-brand-ink-muted leading-relaxed" style={{ maxWidth: "46ch" }}>
                Preparing for competitive military selection requires discipline and strategy. Simply upload your official exam syllabus to receive an adaptive daily preparation roadmap and interactive timed practice tests—powered by Google Gemini AI.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="flex flex-col sm:flex-row gap-4 mt-3">
                <Link href="/welcome" className={ctaPrimary}>
                  See how it works
                  <Icon icon={ArrowRight} size="sm" />
                </Link>
                <Link href="/login" className={ctaSecondaryDark}>
                  Sign in to portal
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-6 mt-2 pt-4 border-t border-brand-ink-inverse/10 text-xs text-brand-ink-muted">
                <span className="flex items-center gap-2 font-medium text-slate-300">
                  <CheckCircle2 size={16} className="text-brand-accent-500 shrink-0" /> Zero manual planning
                </span>
                <span className="flex items-center gap-2 font-medium text-slate-300">
                  <CheckCircle2 size={16} className="text-brand-accent-500 shrink-0" /> Instant scoring analysis
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2} direction="up">
            <Hero3D />
          </Reveal>
        </div>
      </section>

      {/* ── 2. Mission Control Preview (Honest Product Glimpse) ────────── */}
      <section className="bg-gradient-to-b from-brand-bg-canvas via-slate-950 to-brand-bg-canvas py-16 md:py-24 border-y border-brand-ink-inverse/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent-500 bg-brand-accent-500/10 px-3 py-1 rounded-full border border-brand-accent-500/20 mb-3 inline-block">
                Mission Control Portal
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink-inverse tracking-tight">
                Your entire study flight deck at a glance
              </h2>
              <p className="text-body-sm text-brand-ink-muted mt-2">
                No cluttered binders or unorganized book stacks. Track your daily readiness metrics, precision scoring, and weak-topic diagnostics in one unified command center.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} direction="up">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden max-w-5xl mx-auto">
              {/* Decorative HUD background ring */}
              <div className="absolute -right-24 -top-24 w-96 h-96 bg-brand-accent-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* HUD Telemetry Metric 1 */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-3">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider"><Activity size={15} className="text-emerald-400" /> Syllabus Readiness</span>
                    <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">On Track</span>
                  </div>
                  <div className="text-2xl font-display font-bold text-white mb-1">84.5%</div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full w-[85%] rounded-full" />
                  </div>
                </div>

                {/* HUD Telemetry Metric 2 */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-3">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider"><Gauge size={15} className="text-sky-400" /> Test Speed & Accuracy</span>
                    <span className="text-sky-400 font-mono">1.2m / ques</span>
                  </div>
                  <div className="text-2xl font-display font-bold text-white mb-1">91% Accuracy</div>
                  <p className="text-[11px] text-slate-400">Consistent precision across general knowledge and mathematics.</p>
                </div>

                {/* HUD Telemetry Metric 3 */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-3">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider"><BarChart3 size={15} className="text-brand-accent-500" /> Daily Target</span>
                    <span className="text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/20">4 / 5 Mapped</span>
                  </div>
                  <div className="text-sm font-bold text-slate-200 truncate mb-1">Navigation & Spatial Reasoning</div>
                  <p className="text-[11px] text-slate-400">Next recommended timed practice session ready for launch.</p>
                </div>
              </div>

              {/* Sample Timed Practice Question Preview Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent-500 mr-2">CBT Practice Module</span>
                    <h4 className="text-base font-bold text-white inline">Air Force Common Admission Test (AFCAT) Sample</h4>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    <Clock size={14} className="text-amber-400" /> Time Elapsed: 08:24
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-4 font-medium">
                  <strong className="text-white">Question Preview:</strong> Which of the following indigenous fighter aircraft is developed by Hindustan Aeronautics Limited (HAL) for the Indian Air Force?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-400">
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 flex items-center justify-between">
                    <span>A. HAL Tejas (LCA)</span>
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400">B. Dassault Rafale</div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-slate-400 mb-4 font-medium">
                  Want to try answering sample exam questions and generating a study roadmap right now?
                </p>
                <Link href="/welcome" className={ctaPrimary}>
                  Take the guided platform tour
                  <Icon icon={ArrowRight} size="sm" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3. Cohesive Feature Modules (Flight Deck Styling) ────────────── */}
      <section className="bg-brand-bg-canvas py-24 md:py-32">
        <Container>
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink-inverse tracking-tight">
                Everything required to conquer the exam without guesswork
              </h2>
              <p className="text-body-md text-brand-ink-muted mt-3">
                Traditional exam preparation relies on scattered PDF books and overwhelming video lectures. ExamPilot automates your timeline so you focus 100% of your energy on practicing and succeeding.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, summary, detail }, i) => (
              <Reveal key={title} delay={i * 0.06} direction="up" className="h-full">
                <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-brand-accent-500/50 p-8 rounded-3xl transition-all duration-base flex flex-col justify-between h-full shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] group">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent-500/10 text-brand-accent-500 border border-brand-accent-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-base">
                      <Icon icon={icon} size="md" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
                    <p className="text-sm font-semibold text-slate-300 mb-4">{summary}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-4 mt-auto">{detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 4. How It Works (Aviation Navigation Steps) ───────────────────── */}
      <section className="bg-slate-950 py-24 md:py-32 border-t border-brand-ink-inverse/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3 inline-block">
                Flight Plan Execution
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink-inverse tracking-tight">
                Your guided flight path in 3 clear steps
              </h2>
            </div>
          </Reveal>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map(({ icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08} direction="up">
                <li className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-full relative group hover:border-slate-700 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent-500/10 border border-brand-accent-500/20 flex items-center justify-center text-brand-accent-500 mb-6 font-bold text-sm">
                    <Icon icon={icon} size="md" />
                  </div>
                  <p className="font-bold text-base text-white mb-2">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.25}>
            <div className="mt-14 text-center">
              <Link href="/welcome" className={ctaPrimary}>
                Take the guided tour (Zero sign-up needed)
                <Icon icon={ArrowRight} size="sm" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 5. Tejas Wingman Spotlight Slot ─────────────────────────────── */}
      <section className="bg-brand-bg-canvas py-16 md:py-24 border-t border-brand-ink-inverse/10">
        <Container>
          {spotlightSlot}
        </Container>
      </section>

      <MarketingFooter />
    </div>
  );
}
