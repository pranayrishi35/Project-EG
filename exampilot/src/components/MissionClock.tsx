"use client";

import { useState, useEffect } from "react";

interface MissionClockProps {
  examDate?: string;
  initialSeconds?: number;
  onTick?: (secondsLeft: number) => void;
  onTimeUp?: () => void;
}

export default function MissionClock({ examDate, initialSeconds, onTick, onTimeUp }: MissionClockProps) {
  // Mode: if initialSeconds is provided, it's a test timer (HH:MM:SS)
  // Otherwise, it's the dashboard countdown.
  const isTestMode = initialSeconds !== undefined;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [testSecondsLeft, setTestSecondsLeft] = useState(initialSeconds || 0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (isTestMode) {
      if (initialSeconds === undefined || initialSeconds <= 0) return;
      
      // Compute the absolute end time when the component mounts
      const targetEndTime = Date.now() + initialSeconds * 1000;
      
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTime - now) / 1000));
        
        setTestSecondsLeft(remaining);
        
        if (onTick) {
           onTick(remaining);
        }
        
        if (remaining <= 0) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (examDate) {
      const targetDate = new Date(examDate).getTime();
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };

      calculateTimeLeft(); // initial calculation
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [examDate, isTestMode]); // omitted testSecondsLeft to avoid re-triggering interval

  if (!isMounted) return null; // Hydration safe

  if (isTestMode) {
    const h = Math.floor(testSecondsLeft / 3600);
    const m = Math.floor((testSecondsLeft % 3600) / 60);
    const s = testSecondsLeft % 60;
    const isUrgent = testSecondsLeft < 300; // less than 5 minutes

    return (
      <div className={`font-mono text-xl font-bold px-4 py-2 rounded-xl border flex items-center gap-2 shadow-inner transition-colors duration-300 ${isUrgent ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-900 border-slate-700 text-emerald-400'}`}>
        <span>⏱️</span>
        <span>
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
      </div>
    );
  }

  // Dashboard countdown view
  return (
    <div className="print:hidden w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)", backgroundSize: "20px 20px" }} aria-hidden="true" />
      
      <p className="relative text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Mission Clock
      </p>
      
      <div className="relative flex items-center gap-3 md:gap-4 text-white font-mono">
        {Object.entries(timeLeft).map(([unit, value], idx, arr) => (
          <div key={unit} className="flex items-center gap-3 md:gap-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
                {String(value).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                {unit}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <span className="text-xl md:text-2xl font-bold text-slate-600 pb-4 animate-pulse">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
