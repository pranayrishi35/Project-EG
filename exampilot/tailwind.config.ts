import type { Config } from "tailwindcss";

/**
 * ExamPilot design tokens (Phase 1 — Foundation).
 *
 * The new design-system tokens live under the `brand` color namespace and the
 * `display`/`body`/`mono` font families so they cannot collide with any of the
 * legacy `bg-*` / `text-*` utilities that existing pages already depend on.
 * Colors, the fluid type scale, and motion values are sourced from CSS custom
 * properties defined in `globals.css`, which stays the single source of truth.
 * This config is purely additive — no existing utility is repointed or removed.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy — do not remove; existing pages read these.
        background: "var(--background)",
        foreground: "var(--foreground)",

        // ─── Design system (§1.1) ──────────────────────────────────────────
        brand: {
          bg: {
            canvas: "var(--color-bg-canvas)",
            surface: "var(--color-bg-surface)",
            elevated: "var(--color-bg-elevated)",
            paper: "var(--color-bg-paper)",
            "paper-alt": "var(--color-bg-paper-alt)",
          },
          ink: {
            primary: "var(--color-ink-primary)",
            inverse: "var(--color-ink-inverse)",
            muted: "var(--color-ink-muted)",
          },
          border: {
            subtle: "var(--color-border-subtle)",
            strong: "var(--color-border-strong)",
          },
          accent: {
            400: "var(--color-accent-400)",
            500: "var(--color-accent-500)",
            600: "var(--color-accent-600)",
            ink: "var(--color-accent-ink)",
          },
          // Semantic — CBT / status. Kept separate from the accent color.
          success: "var(--color-success)",
          danger: "var(--color-danger)",
          warning: "var(--color-warning)",
          info: "var(--color-info)",
        },
      },

      // ─── Typography (§1.2) ───────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // [size, { lineHeight }] — display tight (1.1–1.2), body generous (1.5–1.65).
        "display-xl": ["var(--text-display-xl)", { lineHeight: "1.1" }],
        "display-lg": ["var(--text-display-lg)", { lineHeight: "1.15" }],
        "display-md": ["var(--text-display-md)", { lineHeight: "1.2" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.65" }],
        "body-base": ["var(--text-body)", { lineHeight: "1.6" }],
        "body-sm": ["var(--text-body-sm)", { lineHeight: "1.5" }],
        "mono-lg": ["var(--text-mono-lg)", { lineHeight: "1.1" }],
      },

      // ─── Motion (§1.3 / MOTION_SYSTEM.md) ──────────────────────────────
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
        cinematic: "var(--ease-cinematic)",
        snappy: "var(--ease-snappy)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        smooth: "var(--duration-smooth)",
        slow: "var(--duration-slow)",
        cinematic: "var(--duration-cinematic)",
      },
    },
  },
  plugins: [],
};
export default config;
