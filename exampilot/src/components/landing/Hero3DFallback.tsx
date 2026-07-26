"use client";

import { useReducedMotion } from "framer-motion";
import { Crosshair, ShieldCheck, Compass, Radio } from "lucide-react";

/**
 * Hero3DFallback — High-fidelity zero-JS aerodynamic HUD reticle and delta jet assembly.
 * 
 * Served seamlessly when WebGL is unavailable, during Next.js dynamic bundle chunking,
 * on low-power touch/mobile viewports, or when prefers-reduced-motion is active.
 * Guarantees visual wow-factor and premium aesthetics without WebGL overhead.
 */
export default function Hero3DFallback() {
  const reduce = useReducedMotion();

  const spinSlow = reduce ? "" : "animate-[spin_20s_linear_infinite]";
  const spinReverse = reduce ? "" : "animate-[spin_15s_linear_infinite_reverse]";
  const pulseSlow = reduce ? "" : "animate-[pulse_3s_ease-in-out_infinite]";
  const floatJet = reduce ? "" : "animate-[bounce_6s_ease-in-out_infinite]";

  return (
    <div
      data-testid="hero-3d-fallback"
      className="relative mx-auto w-full max-w-[340px] sm:max-w-[420px] h-[360px] sm:h-[420px] flex items-center justify-center select-none overflow-hidden rounded-[2.5rem] border border-brand-accent-500/20 bg-brand-bg-canvas/90 shadow-[0_0_50px_rgba(245,166,35,0.12)] p-6"
    >
      {/* Ambient Radial Emissive Glow */}
      <div
        className="absolute -inset-10 pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,166,35,0.18), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Outer Radar Sweeper Ring */}
      <div className={`absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-dashed border-brand-accent-500/30 ${spinSlow}`} aria-hidden="true" />

      {/* Middle Concentric Target Ring */}
      <div className={`absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-brand-accent-500/20 flex items-center justify-center ${spinReverse}`} aria-hidden="true">
        <div className="w-2 h-2 rounded-full bg-brand-accent-500 absolute top-0 -translate-y-1" />
        <div className="w-2 h-2 rounded-full bg-brand-accent-500 absolute bottom-0 translate-y-1" />
        <div className="w-2 h-2 rounded-full bg-brand-accent-500 absolute left-0 -translate-x-1" />
        <div className="w-2 h-2 rounded-full bg-brand-accent-500 absolute right-0 translate-x-1" />
      </div>

      {/* Inner Precision Crosshair */}
      <div className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-brand-accent-500/40 flex items-center justify-center ${pulseSlow}`} aria-hidden="true">
        <Crosshair className="w-8 h-8 sm:w-12 sm:h-12 text-brand-accent-500/40" />
      </div>

      {/* Aerodynamic Delta Wing Jet Symbol */}
      <div className={`relative z-10 p-5 sm:p-6 rounded-3xl bg-slate-950 border border-brand-accent-500/40 shadow-[0_0_40px_rgba(245,166,35,0.25)] flex items-center justify-center ${floatJet}`}>
        <svg
          width="54"
          height="54"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="drop-shadow-[0_0_12px_rgba(245,166,35,0.8)] -rotate-45 transition-transform duration-700 hover:scale-110"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21.5 4s-2 .5-3.5 2L14.5 9.5 6.3 7.7c-.8-.2-1.5.4-1.4 1.2l.6 4.3 3 3-2 2-.8-.2-.8-.8-1.5 1.5 2.6 2.6 2.6 2.6 1.5-1.5-.8-.8-.2-.8 2-2 3 3 4.3.6c.8.1 1.4-.6 1.2-1.4Z" />
        </svg>
      </div>

      {/* Top-Left AI Engine Chip */}
      <div className="absolute top-4 left-2 sm:left-4 flex items-center gap-2 rounded-xl bg-brand-bg-surface/90 backdrop-blur-md border border-brand-border-subtle px-2.5 sm:px-3 py-1.5 shadow-md">
        <Radio className="w-3.5 h-3.5 text-brand-accent-500 animate-pulse" />
        <div className="text-left">
          <p className="text-[9px] uppercase tracking-wider text-brand-ink-muted">AI Study Engine</p>
          <p className="font-mono text-[11px] font-bold text-brand-ink-inverse">Adaptive Syllabus Plan</p>
        </div>
      </div>

      {/* Bottom-Right Target Exams Chip */}
      <div className="absolute bottom-4 right-2 sm:right-4 flex items-center gap-1.5 sm:gap-2 rounded-xl bg-brand-accent-500/15 border border-brand-accent-500/30 px-2.5 sm:px-3 py-1.5 shadow-md">
        <ShieldCheck className="w-4 h-4 text-brand-accent-500 shrink-0" />
        <div className="text-left">
          <p className="text-[9px] uppercase tracking-wider text-brand-accent-500 font-semibold">Target Exams</p>
          <p className="font-mono text-[11px] font-bold text-brand-ink-inverse">AFCAT · CDS · NDA</p>
        </div>
      </div>

      {/* Bottom-Left CBT Engine Status */}
      <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-1.5 text-brand-ink-muted">
        <Compass className="w-3.5 h-3.5 text-brand-accent-500/70" />
        <span className="font-mono text-[10px] tracking-wider">Server-Authoritative CBT</span>
      </div>
    </div>
  );
}
