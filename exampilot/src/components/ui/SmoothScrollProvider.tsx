"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * SmoothScrollProvider (Phase 1 — Custom Jet Cursor & Scrollcraft Rebuild)
 * ────────────────────────────────────────────────────────────────────────
 * Globally mounted once in the root layout. Provides:
 *   1. Lenis smooth scroll
 *   2. A directional fighter-jet silhouette custom cursor (~24px)
 *
 * Both are gated behind strict exclusion rules:
 *   - CBT EXCLUSION: active mock surfaces (`TestRunner`) receive zero decorative
 *     motion and no custom cursor to prevent CPU/GPU contention and maintain
 *     a calm testing environment.
 *   - Desktop >=1024px + fine pointer required for custom cursor.
 *   - `prefers-reduced-motion: reduce` force-disables both custom cursor and Lenis.
 */

function isCbtRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/practice/mock/") ||
    pathname.startsWith("/practice/current-affairs")
  );
}

export default function SmoothScrollProvider() {
  const pathname = usePathname();

  const [cursorActive, setCursorActive] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);

  // References for direct DOM hardware manipulation (zero React re-render lag)
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const angleRef = useRef(0);
  const rafIdRef = useRef(0);
  const hasMovedRef = useRef(false);

  const onCbt = isCbtRoute(pathname);

  // ── Evaluate guards on mount & media query change ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      const motionOk = !reduce.matches;
      setScrollActive(motionOk && !onCbt);
      setCursorActive(motionOk && desktop.matches && fine.matches && !onCbt);
    };

    evaluate();

    const attach = (mql: MediaQueryList) => {
      if (mql.addEventListener) mql.addEventListener("change", evaluate);
      else mql.addListener(evaluate);
    };
    const detach = (mql: MediaQueryList) => {
      if (mql.removeEventListener) mql.removeEventListener("change", evaluate);
      else mql.removeListener(evaluate);
    };
    [desktop, fine, reduce].forEach(attach);
    return () => [desktop, fine, reduce].forEach(detach);
  }, [onCbt]);

  // ── Lenis smooth scroll (only while scrollActive) ──────────────────────────
  useEffect(() => {
    if (!scrollActive) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [scrollActive]);

  // ── Directional Jet Cursor: pointer tracking + rAF interpolation ───────────
  useEffect(() => {
    if (!cursorActive) return;

    const root = document.documentElement;
    root.setAttribute("data-cursor", "custom");

    const onPointerMove = (e: PointerEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!hasMovedRef.current) {
        currentPos.current = { x: e.clientX, y: e.clientY };
        hasMovedRef.current = true;
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const loop = () => {
      const el = cursorRef.current;
      if (el && hasMovedRef.current) {
        const dx = targetPos.current.x - currentPos.current.x;
        const dy = targetPos.current.y - currentPos.current.y;
        const dist = Math.hypot(dx, dy);

        // Only update angle when moving significantly to prevent rotation jitter
        if (dist > 0.5) {
          const rad = Math.atan2(dy, dx);
          const deg = rad * (180 / Math.PI);

          // Shortest path delta angle calculation prevents 360deg snap artifacts
          let deltaAngle = deg - angleRef.current;
          while (deltaAngle > 180) deltaAngle -= 360;
          while (deltaAngle < -180) deltaAngle += 360;
          angleRef.current += deltaAngle;

          currentPos.current = { x: targetPos.current.x, y: targetPos.current.y };
        }

        // Apply hardware-accelerated 3D transform positioning around 24x24 center
        el.style.transform = `translate3d(${targetPos.current.x - 12}px, ${targetPos.current.y - 12}px, 0px) rotate(${angleRef.current}deg)`;
        if (el.style.opacity !== "1") {
          el.style.opacity = "1";
        }
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafIdRef.current);
      root.removeAttribute("data-cursor");
    };
  }, [cursorActive]);

  if (!cursorActive) return null;

  return (
    <div
      ref={cursorRef}
      data-testid="jet-cursor"
      aria-hidden="true"
      style={{ opacity: 0, transform: "translate3d(-100px, -100px, 0px) rotate(0deg)" }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:flex h-6 w-6 items-center justify-center transition-opacity duration-150 select-none"
    >
      {/* Precision 24x24 Line-Art Fighter-Jet Silhouette (oriented pointing right along +X axis at 0 deg) */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_rgba(245,166,35,0.65)]"
      >
        <path
          d="M 23 12 L 9 21 L 7 15 L 2 18 L 1 12 L 2 6 L 7 9 L 9 3 Z"
          fill="#0F172A"
          stroke="var(--cursor-jet, #F5A623)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M 7 15 L 14 12 L 7 9"
          stroke="var(--cursor-jet, #F5A623)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
