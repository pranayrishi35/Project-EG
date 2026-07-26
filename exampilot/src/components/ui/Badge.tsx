import type { ReactNode } from "react";

/**
 * Badge / Pill — design-system label component (Phase 2).
 *
 * Variants map to semantic colors from §1.1 so review-status, tier, and
 * streak labels all stay consistent. Server-safe (no "use client").
 */

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  default:  "bg-brand-bg-elevated text-brand-ink-muted border-brand-border-subtle",
  success:  "bg-[rgba(34,197,94,0.12)] text-brand-success border-[rgba(34,197,94,0.25)]",
  warning:  "bg-[rgba(245,158,11,0.12)] text-brand-warning border-[rgba(245,158,11,0.25)]",
  danger:   "bg-[rgba(239,68,68,0.12)] text-brand-danger border-[rgba(239,68,68,0.25)]",
  info:     "bg-[rgba(56,189,248,0.12)] text-brand-info border-[rgba(56,189,248,0.25)]",
  accent:   "bg-[rgba(245,166,35,0.15)] text-brand-accent-500 border-[rgba(245,166,35,0.30)]",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
        "text-xs font-semibold border",
        className.includes("whitespace-") ? "leading-none" : "leading-none whitespace-nowrap",
        VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

export default Badge;
