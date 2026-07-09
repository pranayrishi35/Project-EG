"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Config ────────────────────────────────────────────────────────────────────

const MODES = {
  focus: { label: "Focus", minutes: 50 },
  break: { label: "Break", minutes: 10 },
} as const;

type Mode = keyof typeof MODES;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function FocusTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset timer when mode changes
  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  }, [mode]);

  // Countdown tick — pure client-side, never hits the server
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  }, [mode]);

  const totalSecs = MODES[mode].minutes * 60;
  // Circumference of the SVG ring (r=42)
  const CIRC = 2 * Math.PI * 42;
  const dashOffset = CIRC * (timeLeft / totalSecs); // shrinks as timer runs

  // ── Collapsed pill (floating button) ────────────────────────────────────────
  if (!isExpanded) {
    return (
      <button
        id="focus-timer-pill"
        onClick={() => setIsExpanded(true)}
        aria-label={`Open focus timer — ${fmt(timeLeft)} remaining`}
        className={[
          "fixed bottom-24 right-4 z-40",
          "flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-white text-xs font-bold",
          "shadow-lg transition-all duration-200 active:scale-95 hover:scale-105",
          isRunning ? "animate-pulse" : "",
        ].join(" ")}
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          boxShadow: isRunning
            ? "0 4px 20px rgba(124, 58, 237, 0.6)"
            : "0 4px 16px rgba(79, 70, 229, 0.35)",
        }}
      >
        {/* Clock icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>

        <span className="tabular-nums">{fmt(timeLeft)}</span>

        {/* Live dot */}
        {isRunning && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" aria-label="Running" />
        )}
      </button>
    );
  }

  // ── Expanded card ────────────────────────────────────────────────────────────
  return (
    <div
      id="focus-timer-card"
      className="fixed bottom-24 right-4 z-40 w-60 rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "linear-gradient(160deg, #4338CA 0%, #6D28D9 100%)" }}
      role="dialog"
      aria-label="Focus timer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-white text-sm font-bold tracking-tight">
          🍅 Focus Timer
        </span>
        <button
          onClick={() => setIsExpanded(false)}
          className="w-6 h-6 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Minimise timer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex mx-4 rounded-xl bg-black/20 p-0.5">
        {(Object.entries(MODES) as [Mode, { label: string; minutes: number }][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={[
                "flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200",
                mode === key
                  ? "bg-white text-indigo-700 shadow"
                  : "text-white/60 hover:text-white/90",
              ].join(" ")}
              aria-pressed={mode === key}
            >
              {cfg.label}
              <span className="ml-1 opacity-60 font-normal">
                {cfg.minutes}m
              </span>
            </button>
          )
        )}
      </div>

      {/* Circular progress ring */}
      <div className="flex justify-center py-5">
        <div
          className={[
            "relative w-32 h-32",
            isRunning ? "animate-timer-pulse" : "",
          ].join(" ")}
        >
          {/* SVG ring */}
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="7"
            />
            {/* Elapsed arc */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-white text-2xl font-black tabular-nums tracking-tight leading-none">
              {fmt(timeLeft)}
            </span>
            <span className="text-white/50 text-[10px] font-medium uppercase tracking-widest">
              {MODES[mode].label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-5">
        {/* Reset */}
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all duration-150 active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          id="focus-timer-play-pause"
          onClick={() => setIsRunning((r) => !r)}
          aria-label={isRunning ? "Pause" : "Start focus session"}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-white text-indigo-700 shadow-xl transition-all duration-150 hover:scale-105 active:scale-95"
        >
          {isRunning ? (
            /* Pause icon */
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon — offset slightly right for optical centring */
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Spacer (mirrors reset button for centred layout) */}
        <div className="w-10 h-10" aria-hidden="true" />
      </div>
    </div>
  );
}
