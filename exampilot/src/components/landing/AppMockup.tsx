"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, Flame } from "lucide-react";

/**
 * AppMockup — fully-designed abstract hero visual (Path B, no placeholder).
 *
 * A stylized study-plan card + mastery ring + timer built from real design
 * tokens with plausible sample data. Rendered inside a phone frame. Entrance
 * fade+scale and a slow ambient vertical float; both disabled under
 * prefers-reduced-motion.
 */

const MASTERY = 82; // Physics mastery %
const R = 26;
const C = 2 * Math.PI * R;

export default function AppMockup() {
  const reduce = useReducedMotion();

  const float = reduce
    ? {}
    : { animate: { y: [0, -10, 0] }, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const } };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      animate={reduce ? undefined : { opacity: 1, scale: 1 }}
      transition={reduce ? undefined : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-[280px] max-w-full"
    >
      {/* Ambient amber glow */}
      <div
        className="absolute -inset-6 rounded-[3rem] blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, rgba(245,166,35,0.22), transparent 70%)" }}
        aria-hidden="true"
      />

      <motion.div {...float} className="relative">
        {/* Phone frame */}
        <div className="relative rounded-[2.5rem] border-[10px] border-brand-bg-canvas bg-brand-bg-canvas shadow-2xl ring-1 ring-brand-border-subtle">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-24 h-5 rounded-b-2xl bg-brand-bg-canvas" aria-hidden="true" />
          {/* Screen */}
          <div className="rounded-[1.9rem] overflow-hidden bg-brand-bg-surface p-4 pt-7 flex flex-col gap-3" aria-hidden="true">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-ink-muted">Day 14 of 45</p>
                <p className="text-sm font-bold text-brand-ink-inverse">AFCAT Sprint</p>
              </div>
              <div className="flex items-center gap-1 px-2 h-6 rounded-full bg-brand-accent-500/15 text-brand-accent-500">
                <Flame width={12} height={12} strokeWidth={1.75} />
                <span className="font-mono text-[11px] font-bold">12</span>
              </div>
            </div>

            {/* Mastery ring card */}
            <div className="rounded-2xl bg-brand-bg-elevated border border-brand-border-subtle p-3 flex items-center gap-3">
              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                  <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r={R} fill="none" stroke="#F5A623" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C - (C * MASTERY) / 100}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-brand-ink-inverse">
                  {MASTERY}%
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-ink-inverse">Physics — mastery</p>
                <p className="text-[11px] text-brand-ink-muted mt-0.5">Kinematics · Optics · Waves</p>
              </div>
            </div>

            {/* Today's tasks */}
            <div className="rounded-2xl bg-brand-bg-elevated border border-brand-border-subtle p-3 flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-brand-ink-muted">Today</p>
              {[
                { label: "Revise: Newton's Laws", done: true },
                { label: "Mock Test 3 — 50 Q", done: true },
                { label: "Flashcards — 20 cards", done: false },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  {t.done ? (
                    <CheckCircle2 width={15} height={15} strokeWidth={1.75} className="text-brand-success shrink-0" />
                  ) : (
                    <Circle width={15} height={15} strokeWidth={1.75} className="text-brand-ink-muted shrink-0" />
                  )}
                  <span className={`text-[11px] ${t.done ? "text-brand-ink-muted line-through" : "text-brand-ink-inverse"}`}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CBT timer chip */}
            <div className="rounded-2xl bg-brand-accent-500/10 border border-brand-accent-500/25 p-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-brand-accent-500">Next mock in</span>
              <span className="font-mono text-sm font-bold text-brand-accent-500 tabular-nums">01:59:12</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
