"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// A scripted, no-cost taste of Tejas for the guest landing page. It plays a
// short canned conversation on a loop so visitors see the wingman in action
// without spending API quota, then nudges them to launch the live assistant.
type Turn = { role: "user" | "assistant"; text: string };

const SCRIPT: Turn[] = [
  { role: "user", text: "Explain Bernoulli's principle simply." },
  {
    role: "assistant",
    text: "**Bernoulli's principle** 🛩️\n\nFast-moving air = low pressure. Slow-moving air = high pressure.\n\n- A wing is curved on top, flat below.\n- Air moves *faster* over the top → lower pressure above.\n- Higher pressure below pushes the wing up → **lift**.\n\nThat's how your Tejas jet flies. Want a quick MCQ on it?",
  },
  { role: "user", text: "Yes, quiz me!" },
  {
    role: "assistant",
    text: "**Q.** Lift on an aircraft wing is generated primarily due to:\n\n- A) Gravity\n- B) Pressure difference ✅\n- C) Engine thrust\n- D) Air temperature\n\nNailed it? Create a free account and I'll run full adaptive drills with you. 🎯",
  },
];

const FEATURES = [
  { icon: "🧠", title: "Concept breakdowns", desc: "Any topic, explained for a small screen in seconds." },
  { icon: "🎯", title: "Instant drills", desc: "On-demand MCQs tuned to defense-exam patterns." },
  { icon: "🗺️", title: "Revision strategy", desc: "High-yield plans for your final days before the exam." },
  { icon: "🛡️", title: "Always on-mission", desc: "Laser-focused on your syllabus — no distractions." },
];

export default function TejasSpotlight() {
  const [visibleTurns, setVisibleTurns] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  // Only start the scripted playback once the section scrolls into view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Drive the scripted conversation forward with typing pauses, then loop.
  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const step = (i: number) => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setVisibleTurns(0);
            step(0);
          }, 3800)
        );
        return;
      }
      const isAssistant = SCRIPT[i].role === "assistant";
      if (isAssistant) setTyping(true);
      timers.push(
        setTimeout(
          () => {
            if (cancelled) return;
            setTyping(false);
            setVisibleTurns(i + 1);
            timers.push(setTimeout(() => step(i + 1), 700));
          },
          isAssistant ? 1100 : 500
        )
      );
    };

    step(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [started]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleTurns, typing]);

  const launchTejas = () => {
    window.dispatchEvent(
      new CustomEvent("tejas:open", { detail: { prompt: "Explain the concept of relative velocity with a simple example." } })
    );
  };

  return (
    <div
      ref={containerRef}
      id="tejas"
      className="scroll-mt-24 w-full rounded-3xl overflow-hidden border border-indigo-500/20 bg-slate-950 shadow-[0_0_25px_rgba(99,102,241,0.15)] animate-fade-in"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: pitch + features */}
        <div className="relative p-6 md:p-8 flex flex-col justify-center gap-5 overflow-hidden">
          <div className="pointer-events-none absolute -left-10 -top-10 w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Meet your wingman
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-white tracking-tight">
              Tejas <span className="text-lg align-middle">🛩️</span>
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-sm">
              Your always-on AI study wingman. Ask anything on your syllabus and get sharp, exam-ready answers built for
              defense aspirants.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                <span className="text-xl leading-none" aria-hidden="true">{f.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={launchTejas}
            className="relative z-10 self-start inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            🛫 Talk to Tejas now
          </button>
        </div>

        {/* Right: scripted live-demo window */}
        <div className="border-t md:border-t-0 md:border-l border-white/10 bg-slate-900/60 p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 ring-1 ring-indigo-400/40 flex items-center justify-center text-base">🛩️</div>
            <div>
              <p className="text-xs font-black text-white leading-tight">Tejas</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">Live demo</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-[280px] max-h-[320px] overflow-y-auto py-4 flex flex-col gap-2.5 scroll-smooth">
            {SCRIPT.slice(0, visibleTurns).map((turn, i) => (
              <div key={i} className={`flex max-w-[88%] ${turn.role === "user" ? "self-end" : "self-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    turn.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 border border-white/10 rounded-bl-sm prose prose-invert prose-xs max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-indigo-300"
                  }`}
                >
                  {turn.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.text}</ReactMarkdown>
                  ) : (
                    turn.text
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="self-start flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-2xl rounded-bl-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>

          <p className="text-[10px] text-center text-slate-500 pt-2 border-t border-white/10">
            Sample conversation · Launch Tejas for the real thing
          </p>
        </div>
      </div>
    </div>
  );
}
