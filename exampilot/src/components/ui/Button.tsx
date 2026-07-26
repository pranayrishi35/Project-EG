"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * Button — design-system CTA component (Phase 2).
 *
 * Three variants:
 *   primary  — amber fill (brand-accent-500). The one repeated CTA.
 *   secondary — navy outline. Supporting actions.
 *   ghost    — no background. Tertiary / inline actions.
 *
 * Mobile-first: min-h-12 (48px) tap target on all variants.
 * Loading state shows a spinner and disables interaction.
 * Does NOT replace PrimaryButton.tsx — that stays live for existing pages.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl " +
  "transition-all duration-[150ms] ease-standard " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-accent-500 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 " +
  "min-h-12"; // 48px — WCAG touch target

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-accent-500 text-brand-accent-ink hover:bg-brand-accent-400 " +
    "shadow-[0_2px_16px_rgba(245,166,35,0.30)] hover:shadow-[0_4px_24px_rgba(245,166,35,0.45)]",
  secondary:
    "border border-brand-border-strong text-brand-ink-inverse bg-transparent " +
    "hover:border-brand-accent-500 hover:text-brand-accent-500",
  ghost:
    "text-brand-ink-muted bg-transparent hover:text-brand-ink-inverse hover:bg-brand-bg-elevated",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[
          BASE,
          VARIANTS[variant],
          SIZES[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
