import type { ReactNode, HTMLAttributes } from "react";

/**
 * Card variants — design-system (Phase 2).
 *
 * Three variants:
 *   FeatureCard  — landing/feature sections. Detail layer visible by default
 *                  on mobile (no hover on touch); revealed on hover on desktop.
 *   StatCard     — dashboard stats (streak, credits, score). Mono numerals.
 *   ContentCard  — plain container for planner/booklet content.
 *
 * All server-safe (no "use client"). Hover-detail uses CSS group/peer so it
 * works without JS. Motion (transition) respects prefers-reduced-motion via
 * the global globals.css rule on [data-ds-reveal].
 */

/* ── FeatureCard ─────────────────────────────────────────────────────────── */
export interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  /** Always visible summary line */
  summary: string;
  /** Detail shown on hover (desktop) / always visible (mobile) */
  detail?: ReactNode;
  dark?: boolean;
}

export function FeatureCard({
  icon,
  title,
  summary,
  detail,
  dark = false,
  className = "",
  ...rest
}: FeatureCardProps) {
  return (
    <div
      className={[
        "group relative rounded-2xl border p-5 flex flex-col gap-3",
        "transition-all duration-[300ms] ease-standard",
        dark
          ? "bg-brand-bg-elevated border-brand-border-subtle text-brand-ink-inverse hover:border-brand-accent-500/40"
          : "bg-white border-brand-border-strong text-brand-ink-primary hover:border-brand-accent-500/40 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-accent-500/10 text-brand-accent-500 shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-sm leading-snug">{title}</p>
        <p className={`text-xs mt-1 leading-relaxed ${dark ? "text-brand-ink-muted" : "text-brand-ink-muted"}`}>
          {summary}
        </p>
      </div>
      {detail && (
        <div
          className={[
            // Mobile: always visible. Desktop: hidden until hover.
            "text-xs leading-relaxed",
            dark ? "text-brand-ink-muted" : "text-brand-ink-muted",
            // On md+ screens, hide by default and reveal on group-hover.
            "md:max-h-0 md:overflow-hidden md:opacity-0",
            "md:group-hover:max-h-40 md:group-hover:opacity-100",
            "transition-all duration-[300ms] ease-standard",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────────── */
export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  /** Optional small context line below the value */
  sub?: string;
  /** Accent the value in amber */
  accent?: boolean;
  dark?: boolean;
}

export function StatCard({
  label,
  value,
  sub,
  accent = false,
  dark = true,
  className = "",
  ...rest
}: StatCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 flex flex-col gap-1",
        dark
          ? "bg-brand-bg-elevated border-brand-border-subtle"
          : "bg-white border-brand-border-strong",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <p className="text-xs font-medium text-brand-ink-muted uppercase tracking-wider">
        {label}
      </p>
      <p
        className={[
          "font-mono text-mono-lg font-bold leading-none tabular-nums",
          accent ? "text-brand-accent-500" : dark ? "text-brand-ink-inverse" : "text-brand-ink-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-brand-ink-muted leading-snug">{sub}</p>
      )}
    </div>
  );
}

/* ── ContentCard ─────────────────────────────────────────────────────────── */
export interface ContentCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  dark?: boolean;
  noPadding?: boolean;
}

export function ContentCard({
  children,
  dark = false,
  noPadding = false,
  className = "",
  ...rest
}: ContentCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border overflow-hidden",
        noPadding ? "" : "p-5",
        dark
          ? "bg-brand-bg-elevated border-brand-border-subtle"
          : "bg-white border-brand-border-strong",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
