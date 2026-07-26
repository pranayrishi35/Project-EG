import type { LucideIcon } from "lucide-react";

/**
 * Icon — the single wrapper around lucide-react for the whole app.
 *
 * Enforces one stroke width (1.75) and a small set of size tokens so icon
 * weight/scale stays consistent everywhere (§1.4). Import a lucide icon and
 * pass it as the `icon` prop rather than rendering lucide components directly,
 * so the design system stays the one place these defaults live.
 *
 *   import { Target } from "lucide-react";
 *   <Icon icon={Target} size="md" />
 *   <Icon icon={Target} aria-label="Instant drills" />   // labelled / meaningful
 *
 * Pure presentational + server-safe (no "use client"). Decorative by default
 * (aria-hidden); pass `aria-label` to expose it to assistive tech.
 */

export type IconSize = "sm" | "md" | "lg";

const SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export interface IconProps {
  icon: LucideIcon;
  /** sm=16, md=20, lg=24. Defaults to md. */
  size?: IconSize;
  /** Override the single design-system stroke width only when truly needed. */
  strokeWidth?: number;
  className?: string;
  /**
   * When provided, the icon is exposed to assistive tech with this label.
   * When omitted, the icon is decorative (aria-hidden) — the default.
   */
  "aria-label"?: string;
}

export function Icon({
  icon: LucideGlyph,
  size = "md",
  strokeWidth = 1.75,
  className,
  "aria-label": ariaLabel,
}: IconProps) {
  const px = SIZE_PX[size];
  const labelled = typeof ariaLabel === "string" && ariaLabel.length > 0;

  return (
    <LucideGlyph
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? ariaLabel : undefined}
      role={labelled ? "img" : undefined}
      focusable={false}
    />
  );
}

export default Icon;
