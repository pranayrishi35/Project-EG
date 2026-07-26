"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * MarketingNav — thin sticky top nav for the guest landing page only.
 * Transparent over the dark hero; transitions to --color-bg-paper + border
 * once the user scrolls past the hero (~80px).
 */
export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-50 h-[72px] transition-all duration-cinematic ease-cinematic",
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-slate-900/10 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
          : "bg-transparent border-b border-transparent shadow-none",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="ExamPilot home"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400 rounded-lg shrink-0"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0B1220 0%, #1E293B 100%)", border: "1.5px solid rgba(245,166,35,0.4)" }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#F5A623" aria-hidden="true">
              <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.586 1.586A2 2 0 0 0 18 5.293V7l-5 5H9.414l-5.707 5.707a1 1 0 0 0 1.414 1.414L11 13.414V15a1 1 0 0 0 .293.707l4 4A1 1 0 0 0 17 19v-4l2.414-2.414A2 2 0 0 0 20 11.172V9.293l1.707-1.707a1 1 0 0 0 0-1.414l-1-1z" />
            </svg>
          </div>
          <span
            className={[
              "text-lg font-bold tracking-tight hidden sm:block transition-colors duration-cinematic ease-cinematic",
              scrolled ? "text-brand-ink-primary" : "text-brand-ink-inverse",
            ].join(" ")}
          >
            Exam<span className="text-brand-accent-500">Pilot</span>
          </span>
        </Link>

        {/* CTA pair */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className={[
              "inline-flex items-center justify-center min-h-10 px-4 rounded-xl text-sm font-semibold border transition-all duration-smooth ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400",
              scrolled
                ? "border-brand-ink-primary/20 text-brand-ink-primary hover:border-brand-ink-primary/40"
                : "border-brand-ink-inverse/30 text-brand-ink-inverse hover:border-brand-ink-inverse/60",
            ].join(" ")}
          >
            Sign in
          </Link>
          <Link
            href="/welcome"
            className="inline-flex items-center justify-center min-h-10 px-4 rounded-xl text-sm font-semibold bg-brand-accent-500 text-brand-accent-ink hover:bg-brand-accent-400 transition-colors duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-400 focus-visible:ring-offset-2"
          >
            See how it works
          </Link>
        </div>
      </div>
    </header>
  );
}
