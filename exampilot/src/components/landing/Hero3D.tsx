"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Hero3DFallback from "@/components/landing/Hero3DFallback";

/**
 * Dynamically import Three.js scene with ssr: false so zero 3D bundle parsing
 * occurs during initial server render or cold HTML first load.
 */
const DynamicHero3DCanvas = dynamic(() => import("@/components/landing/Hero3DCanvas"), {
  ssr: false,
  loading: () => <Hero3DFallback />,
});

/**
 * Hero3D — Responsive gatekeeper and strict IntersectionObserver supervisor.
 * 
 * Guards against CPU/GPU degradation by:
 * 1. Inspecting system capabilities on mount (WebGL test, reduced motion, touch device).
 *    If WebGL is unavailable or touch/reduced-motion is active, serves Hero3DFallback immediately.
 * 2. Attaching an IntersectionObserver to the DOM wrapper.
 *    When scrolled out of view (isIntersecting === false), completely pauses Three.js frameloop.
 */
export default function Hero3D() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [webGlSupported, setWebGlSupported] = useState<boolean | null>(null);

  // 1. Evaluate system capabilities and WebGL availability on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Check touch device / low-power mobile viewport (threshold refined to 768px to preserve desktop touchscreen laptops)
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768;
    const isSmallViewport = window.innerWidth < 768;
    // Explicit environment flags for verification testing
    const forceFallback = (window as any).__FORCE_WEBGL_FALLBACK === true;
    const forceActive = (window as any).__FORCE_WEBGL_ACTIVE === true;

    let gl: WebGLRenderingContext | null = null;
    try {
      const canvas = document.createElement("canvas");
      gl = canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    } catch (e) {
      gl = null;
    }

    console.log(`[Hero3D Probe] reduceMotion=${reduceMotion}, coarsePointer=${coarsePointer}, width=${window.innerWidth}, forceFallback=${forceFallback}, forceActive=${forceActive}, hasGL=${!!gl}`);

    if (forceFallback) {
      setWebGlSupported(false);
      return;
    }

    if (forceActive && !!gl) {
      setWebGlSupported(true);
      return;
    }

    if (reduceMotion || coarsePointer || isSmallViewport || !gl) {
      setWebGlSupported(false);
    } else {
      setWebGlSupported(true);
    }
  }, []);

  // 2. Attach strict IntersectionObserver to manage pause-on-scroll-out suspension
  useEffect(() => {
    if (!wrapperRef.current || webGlSupported === false) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.05, // Suspend as soon as 95% of hero is off-screen
      }
    );

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [webGlSupported]);

  return (
    <div
      ref={wrapperRef}
      id="hero-3d-wrapper"
      data-testid="hero-3d-wrapper"
      data-intersecting={isIntersecting}
      data-webgl-active={webGlSupported === null ? "probing" : webGlSupported === true ? "true" : "false"}
      className="w-full flex items-center justify-center"
    >
      {webGlSupported === null || webGlSupported === false ? (
        <Hero3DFallback />
      ) : (
        <DynamicHero3DCanvas isIntersecting={isIntersecting} />
      )}
    </div>
  );
}
