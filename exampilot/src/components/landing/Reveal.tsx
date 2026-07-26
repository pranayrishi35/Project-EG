"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Reveal — scroll-triggered entrance wrapper (Phase 3, landing only).
 *
 * framer-motion `whileInView` fade + rise. Respects `prefers-reduced-motion`
 * (via useReducedMotion) — when reduced, content renders instantly with no
 * transform. Also carries `data-ds-reveal` so the global reduced-motion CSS
 * rule in globals.css neutralizes it as a belt-and-braces fallback.
 *
 * [IMPORTANT] Landing / marketing only. Never mount on CBT routes
 * (`/practice/mock/[id]`, `/practice/current-affairs`) — see DESIGN_SYSTEM.md.
 */

type Direction = "up" | "down" | "left" | "right" | "none";

export interface RevealProps {
  children: ReactNode;
  /** Entrance direction (default "up") */
  direction?: Direction;
  /** Delay in seconds before the reveal starts */
  delay?: number;
  /** Travel distance in px for the transform (default 24) */
  distance?: number;
  /** Duration in seconds (default 0.6 → matches --duration-slow) */
  duration?: number;
  /** Render as a different element wrapper */
  as?: "div" | "section" | "li" | "span";
  className?: string;
  /** Fraction of the element visible before triggering (default 0.2) */
  amount?: number;
}

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  distance = 24,
  duration = 0.6,
  as = "div",
  className = "",
  amount = 0.2,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  // Reduced motion: render statically, no transform, no transition.
  if (reduceMotion) {
    const StaticTag = as;
    return (
      <StaticTag data-ds-reveal className={className}>
        {children}
      </StaticTag>
    );
  }

  const { x, y } = offsetFor(direction, distance);

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // --ease-standard
      },
    },
  };

  return (
    <MotionTag
      data-ds-reveal
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  );
}

export default Reveal;
