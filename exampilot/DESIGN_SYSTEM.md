# ExamPilot Design System

Living reference for the ExamPilot UI makeover (Units-inspired: calm authority,
editorial confidence, restrained saffron-on-navy palette, scroll-driven craft).
Update this file as components are built so the system doesn't drift.

**Status:** Phases 1 (Foundation) & 2 (Core components) complete. Phases 3–7 pending.

---

## How the tokens are wired

The single source of truth for token *values* is the design-system `:root` block
at the bottom of `src/app/globals.css`. `tailwind.config.ts` exposes those CSS
variables as utilities under a `brand` namespace (colors) and `display`/`body`/
`mono` families (fonts), plus motion tokens. This keeps the values in one place
and makes them available as ergonomic Tailwind classes.

> **Additive-only rule.** The legacy `:root` (indigo `--color-primary`, etc.),
> the `.ep-*` component classes, `[data-pressure]` planner theme, keyframes, and
> print styles in `globals.css` are still live and drive existing (pre-makeover)
> pages. Do **not** repoint or delete them. New work uses the `brand`/`display`/
> `mono` tokens; old pages migrate component-by-component in later phases.

---

## Color (§1.1)

Base deep navy/steel; saffron/amber accent used sparingly (CTAs, active states,
key numbers, focus rings) — **never as a section background**.

| Token | Tailwind utility | Value | Use |
|---|---|---|---|
| `--color-bg-canvas` | `bg-brand-bg-canvas` | `#0B1220` | deepest bg, hero/dark sections |
| `--color-bg-surface` | `bg-brand-bg-surface` | `#0F172A` | primary dark surface — **matches manifest + meta theme-color; do not change without updating both** |
| `--color-bg-elevated` | `bg-brand-bg-elevated` | `#1E293B` | cards on dark |
| `--color-bg-paper` | `bg-brand-bg-paper` | `#F8F7F3` | light/editorial sections (warm off-white) |
| `--color-bg-paper-alt` | `bg-brand-bg-paper-alt` | `#EFEDE6` | alt paper |
| `--color-ink-primary` | `text-brand-ink-primary` | `#0B1220` | body text on paper |
| `--color-ink-inverse` | `text-brand-ink-inverse` | `#F1F5F9` | body text on navy |
| `--color-ink-muted` | `text-brand-ink-muted` | `#64748B` | muted text |
| `--color-border-subtle` | `border-brand-border-subtle` | `rgba(148,163,184,.16)` | hairlines |
| `--color-border-strong` | `border-brand-border-strong` | `rgba(148,163,184,.32)` | stronger dividers |
| `--color-accent-500` | `bg/text-brand-accent-500` | `#F5A623` | primary saffron |
| `--color-accent-400` | `…-brand-accent-400` | `#FFB800` | accent hover/light |
| `--color-accent-600` | `…-brand-accent-600` | `#D98A0F` | accent pressed |
| `--color-accent-ink` | `text-brand-accent-ink` | `#241300` | text on accent fills |
| `--color-success` | `…-brand-success` | `#22C55E` | correct answers, approved questions |
| `--color-danger` | `…-brand-danger` | `#EF4444` | incorrect answers, strikes |
| `--color-warning` | `…-brand-warning` | `#F59E0B` | pending review, low credits |
| `--color-info` | `…-brand-info` | `#38BDF8` | info |

**Contrast:** run every text/bg pairing through WCAG AA (4.5:1 body, 3:1 large)
before committing. Amber-on-navy and navy-on-paper both need verification.

---

## Typography (§1.2)

| Family | Utility | Font | Use |
|---|---|---|---|
| Display | `font-display` | Space Grotesk → Inter | headlines, hero copy |
| Body | `font-body` | Inter | everything else |
| Mono | `font-mono` | JetBrains Mono | CBT timer, scores, streak, credits **only** |

Fonts are loaded in `src/app/layout.tsx` via `next/font/google` as CSS variables
(`--font-display`, `--font-inter`, `--font-mono`) applied on `<body>`.

Fluid type scale (clamp-based, no separate mobile overrides):

| Utility | Value | Line-height | Use |
|---|---|---|---|
| `text-display-xl` | `clamp(2.75rem, 5vw + 1rem, 5rem)` | 1.1 | hero headline |
| `text-display-lg` | `clamp(2rem, 3vw + 1rem, 3.25rem)` | 1.15 | section headlines |
| `text-display-md` | `clamp(1.5rem, 2vw + 1rem, 2.25rem)` | 1.2 | sub-headlines |
| `text-body-lg` | `1.125rem` | 1.65 | lead paragraphs |
| `text-body-base` | `1rem` | 1.6 | body copy |
| `text-body-sm` | `0.875rem` | 1.5 | small print |
| `text-mono-lg` | `2.5rem` | 1.1 | CBT timer |

> **Naming note:** the base body size is `text-body-base` (not `text-body`) to
> avoid collision with the `font-body` family utility.

---

## Motion (§1.3)

Deps: `framer-motion`, `lenis`. (Motion libs, not component kits — compatible
with the "native Tailwind only" styling rule.)

| Token | Utility | Value |
|---|---|---|
| `--ease-standard` | `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-emphasized` | `ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--duration-fast` | `duration-fast` | 150ms |
| `--duration-base` | `duration-base` | 300ms |
| `--duration-slow` | `duration-slow` | 600ms |

**Reduced motion:** `globals.css` has a global `@media (prefers-reduced-motion: reduce)`
block — reveals (`[data-ds-reveal]`) become instant, the custom cursor is force-off,
Lenis yields to native scroll.

### ⛔ CBT motion-exclusion zone (hard rule)
`TestRunner.tsx` and anything rendered during an **active mock attempt** gets
zero entrance/scroll animation and no custom cursor. Real routes:
`/practice/mock/[id]` and `/practice/current-affairs`. The `SmoothScrollProvider`
enforces this automatically (see below). Subtle ≤150ms micro-feedback (option
select) is fine; scroll-driven / decorative motion is not.
`MockTestAnalyzer.tsx` (post-test, not timed) **may** use normal motion.

---

## Iconography (§1.4)

Standardized on `lucide-react`, one stroke width (`1.75`), sized via the `Icon`
wrapper. Every emoji used as functional UI chrome (🧠🎯🗺️🛡️🛩️) gets replaced in
later phases. Emoji may remain only in Tejas's actual chat-reply copy, never as
UI iconography.

Planned mappings: 🧠→`BookOpen`/`Brain`, 🎯→`Target`, 🗺️→`Map`/`Route`,
🛡️→`ShieldCheck`, 🛩️ Tejas→a one-off custom line-art fighter-jet SVG (Phase 3+).

---

## Components

### `Icon` — `components/ui/Icon.tsx` ✅ (Phase 1)
Thin `lucide-react` wrapper enforcing the single stroke width + size tokens.
Server-safe / pure presentational.

**Props**
| Prop | Type | Default | Notes |
|---|---|---|---|
| `icon` | `LucideIcon` | — | required; pass the lucide glyph, e.g. `Target` |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 16 / 20 / 24 px |
| `strokeWidth` | `number` | `1.75` | override only when truly needed |
| `className` | `string` | — | |
| `aria-label` | `string` | — | when set, icon is exposed (`role="img"`); when omitted, `aria-hidden` (decorative) |

```tsx
import { Target } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

<Icon icon={Target} size="md" />                    // decorative
<Icon icon={Target} aria-label="Instant drills" />  // meaningful
```

### `SmoothScrollProvider` — `components/ui/SmoothScrollProvider.tsx` ✅ (Phase 1)
`"use client"`, mounted once in `layout.tsx` via `dynamic(..., { ssr:false })`.
Provides Lenis smooth scroll + a custom cursor (dot + trailing ring, framer-motion springs).

**Activation guards** (all must pass):
- **Cursor:** desktop `≥1024px` **and** `pointer: fine` **and** not reduced-motion **and** not a CBT route.
- **Lenis:** not reduced-motion **and** not a CBT route (allowed on touch).
- Re-evaluates on `matchMedia` change (resize / OS setting) and on route change.
- On teardown / CBT route: `data-cursor` attribute removed, native cursor + scroll restored.

No props. Renders `null` unless the cursor is active.

---

### `Button` — `components/ui/Button.tsx` ✅ (Phase 2)
`"use client"` (uses forwardRef). Variants: `primary` (amber fill), `secondary`
(navy outline), `ghost`. Sizes `sm`/`md`/`lg`. `loading` shows a spinner and
disables; `fullWidth` stretches. Min tap target 48px (`min-h-12`), amber focus ring.
Does **not** replace `PrimaryButton.tsx` (legacy `.ep-btn-primary`, still live).

### `Badge` — `components/ui/Badge.tsx` ✅ (Phase 2)
Server-safe pill. Variants: `default` / `success` / `warning` / `danger` / `info` /
`accent`. Maps review-status (approved→success, pending→warning, rejected→danger),
tier, streak.

### `Card` — `components/ui/Card.tsx` ✅ (Phase 2)
Server-safe. Exports `FeatureCard` (hover-detail — detail always visible on mobile,
CSS `group-hover` reveal on `md+`, no JS), `StatCard` (mono numerals, `accent`/`dark`),
`ContentCard` (plain container).

### Layout — `components/ui/Layout.tsx` ✅ (Phase 2)
Server-safe. `Section` (full-width, `py-16 md:py-24` rhythm, `dark` for canvas/navy)
and `Container` (centered, `max-w-6xl` / `narrow` `max-w-3xl`, responsive padding).

### Navigation — updated in place ✅ (Phase 2)
`BottomNav.tsx` (mobile, primary nav) and `Sidebar.tsx` (`md+`) migrated from inline
SVGs to lucide glyphs; active state indigo → **amber** (`brand-accent-500`). Routes,
`data-testid`s, aria, and structure unchanged. `Header.tsx` emoji chrome (💬🔥⚠️⚡)
replaced with lucide (`MessageSquare`/`Flame`/`Zap`/`AlertTriangle`); badge colors and
all data-fetching/auth logic left intact (full Header restyle deferred to Phase 4).

### Pending (Phase 2 remainder → folded into later phases)
- [ ] `Nav` marketing top nav — built during Phase 3 landing rebuild (needs hero context)
- [ ] `Modal` / `Sheet` — built during Phase 4/5 when the Tejas panel is restyled
- [ ] Form primitives (input, file-upload dropzone, select) — built during Phase 5 (CreatePlanForm)
