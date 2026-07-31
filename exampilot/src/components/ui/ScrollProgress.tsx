"use client";

import { useEffect, useState } from "react";

/**
 * ScrollProgress — thin fixed progress bar tracking page scroll (Phase 6).
 *
 * Renders a 2px amber accent bar at the top of the viewport that fills left-to-right
 * based on scroll position. Gated on `prefers-reduced-motion: reduce` — when reduced,
 * the bar is hidden entirely.
 *
 * Works seamlessly with Lenis smooth scroll (reads window.scrollY, which lenis updates).
 * z-index: 40 — sits below the fixed nav (z-50), above page content.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const checkMotion = () => setVisible(!reduceMotion.matches);
    checkMotion();

    const attach = (mql: MediaQueryList) => {
      if (mql.addEventListener) mql.addEventListener("change", checkMotion);
      else mql.addListener(checkMotion);
    };
    const detach = (mql: MediaQueryList) => {
      if (mql.removeEventListener) mql.removeEventListener("change", checkMotion);
      else mql.removeListener(checkMotion);
    };
    attach(reduceMotion);

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrolled)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateProgress);
      detach(reduceMotion);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-40 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-accent-500 transition-transform duration-75 ease-linear origin-left"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
