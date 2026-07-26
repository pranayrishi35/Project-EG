import type { ReactNode } from "react";

/**
 * DeviceFrame — hero/section device chrome with PLACEHOLDER SLOTS (Phase 3).
 *
 * Renders realistic device bezels (phone-first, since ExamPilot is mobile-first)
 * with an empty, clearly-marked slot where a real product screenshot gets dropped
 * in later. We deliberately do NOT fabricate fake CSS/SVG UI mockups — the slot
 * shows a labelled placeholder until a real asset is supplied via `children` or
 * `src`.
 *
 * Server-safe (pure presentational, no "use client").
 */

type Variant = "phone" | "browser";

export interface DeviceFrameProps {
  variant?: Variant;
  /** Optional real screenshot URL. When set, fills the slot; else placeholder. */
  src?: string;
  alt?: string;
  /** Custom slot content (e.g. a live component). Overrides src + placeholder. */
  children?: ReactNode;
  /** Short label describing what screenshot belongs here (placeholder state). */
  placeholderLabel?: string;
  className?: string;
}

export function DeviceFrame({
  variant = "phone",
  src,
  alt = "",
  children,
  placeholderLabel = "Screenshot slot",
  className = "",
}: DeviceFrameProps) {
  const slot = children ? (
    children
  ) : src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
  ) : (
    <PlaceholderSlot label={placeholderLabel} />
  );

  if (variant === "browser") {
    return (
      <div
        className={[
          "rounded-2xl border border-brand-border-strong bg-brand-bg-elevated shadow-2xl overflow-hidden",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Browser chrome bar */}
        <div className="flex items-center gap-1.5 px-4 h-10 border-b border-brand-border-subtle bg-brand-bg-surface">
          <span className="w-3 h-3 rounded-full bg-brand-danger/70" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-brand-warning/70" aria-hidden="true" />
          <span className="w-3 h-3 rounded-full bg-brand-success/70" aria-hidden="true" />
          <div className="ml-3 flex-1 h-5 rounded-md bg-brand-bg-elevated/80 border border-brand-border-subtle" />
        </div>
        <div className="relative aspect-[16/10] bg-brand-bg-canvas">{slot}</div>
      </div>
    );
  }

  // Phone (default, mobile-first)
  return (
    <div
      className={[
        "relative mx-auto w-[280px] max-w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative rounded-[2.5rem] border-[10px] border-brand-bg-canvas bg-brand-bg-canvas shadow-2xl ring-1 ring-brand-border-strong">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-28 h-6 rounded-b-2xl bg-brand-bg-canvas" aria-hidden="true" />
        {/* Screen */}
        <div className="relative aspect-[9/19] rounded-[1.9rem] overflow-hidden bg-brand-bg-surface">
          {slot}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSlot({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
      data-placeholder-slot
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 12px, transparent 12px, transparent 24px)",
      }}
    >
      <div className="w-10 h-10 rounded-xl border border-dashed border-brand-border-strong flex items-center justify-center text-brand-ink-muted">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      <p className="text-xs font-medium text-brand-ink-muted uppercase tracking-wider">
        {label}
      </p>
      <p className="text-[10px] text-brand-ink-muted/70 leading-snug max-w-[80%]">
        Drop product screenshot here
      </p>
    </div>
  );
}

export default DeviceFrame;
