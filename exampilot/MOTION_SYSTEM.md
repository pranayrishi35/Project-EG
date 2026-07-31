# Jishnu — Comprehensive Motion System & Animation Architecture (MOTION_SYSTEM.md)

## Purpose & Core Philosophy
The Jishnu motion system operates on a cohesive **Tactical Aviation Flight Deck / Mission Control metaphor**. Motion across the platform is designed to feel **precise, responsive, buoyant, and deeply intentional**, never superfluous or distracting. Every hover effect, section transition, navigation bar transformation, and modal surface must derive from a single unified physics language rather than disconnected ad-hoc effects.

---

## 1. Universal Easing Curves (The "Fighter-Jet" Profile)
We abandon generic linear or mechanical default browser transitions in favor of calibrated cubic-bezier spring and exponential deceleration profiles that mirror tactile cockpit instrumentation and hydrodynamic glide mechanics.

| Token Name | Cubic-Bezier Value | Purpose & Application Surface |
| :--- | :--- | :--- |
| **`ease-standard`** | `cubic-bezier(0.16, 1, 0.3, 1)` | **Default interface physics.** Smooth initial acceleration with long, silky deceleration. Used for buttons, hover states, card elevation, and accordion toggles. |
| **`ease-cinematic`** | `cubic-bezier(0.22, 1, 0.36, 1)` | **Extended structural transitions.** Deeply resonant glide. Used for top navigation bar glassmorphism color transformations, sheet reveals, and layout shifts. |
| **`ease-snappy`** | `cubic-bezier(0.05, 0.7, 0.1, 1.0)` | **High-velocity micro-interactions.** Responsive immediate tactile feedback. Used for dropdown menus, tooltip popups, and checkbox/toggle switches. |

---

## 2. Standard Duration Tiers
Every CSS transition or JS animation duration must strictly map to one of these standardized timing intervals to maintain cadence harmony across all UI components:

* **`duration-instant` (150ms):** Tooltips, radio button fills, micro-toggles.
* **`duration-base` (250ms):** Button color hovers, link underlines, interactive icon rotation.
* **`duration-smooth` (400ms):** Card elevation lifts, modal dialog expansion, drawer sidebars.
* **`duration-cinematic` (600ms):** Top bar adaptive glass transformations, hero section proximity settlement, page entrance fades.

---

## 3. Adaptive Top Bar Glassmorphism Tokens
The application top bar (`MarketingNav` and main `Header`) moves dynamically between two primary frosted glass states depending on underlying background luminance and scroll depth:

### A. Deep Obsidian Glass (Over Dark Aviation Theme & 3D Hero)
* **Background:** `rgba(11, 18, 32, 0.75)` (`bg-[#0B1220]/75`)
* **Blur Backdrop:** `backdrop-blur-md` (`12px`)
* **Border:** `1px solid rgba(255, 255, 255, 0.1)` (`border-white/10`)
* **Text Tone:** High-contrast inverse white (`text-brand-ink-inverse`)
* **Box Shadow:** `0 4px 30px rgba(0, 0, 0, 0.3)`

### B. Frosted Pearl Glass (Over Light Paper & Educational Features)
* **Background:** `rgba(255, 255, 255, 0.85)` (`bg-white/85`)
* **Blur Backdrop:** `backdrop-blur-md` (`12px`)
* **Border:** `1px solid rgba(15, 23, 42, 0.08)` (`border-slate-900/8`)
* **Text Tone:** Primary deep ink (`text-brand-ink-primary`)
* **Box Shadow:** `0 2px 20px rgba(0, 0, 0, 0.05)`

**Transition Law:** Transitioning between transparent, Obsidian Glass, and Frosted Pearl must always employ `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]` to prevent abrasive binary color popping.

---

## 4. Non-Intrusive Scroll Proximity (No Rigid Snapping)
* **Rule against Mandatory Snapping:** Mandatory viewport snapping (`scroll-snap-type: y mandatory`) is strictly prohibited sitewide to prevent mobile content clipping, variable font height lockups, and interference with natural visitor scanning velocity.
* **Allowed Assisted Proximity:** Gentle proximity assistance (`scroll-snap-type: y proximity` with `scroll-snap-align: start`) is permitted exclusively around key foundational landmarks (such as the primary Hero section) to offer subtle magnetic settlement when a user voluntarily pauses near a section boundary.

---

## 5. Strict Accessibility & CBT Exclusion Safeguards
1. **Computer-Based Test (CBT) Exclusion:** Any active test runner or timed mock practice surface (`/practice/mock/*`) must disable all non-essential decorative animations, custom cursors, and parallax motion to guarantee zero GPU contention, instantaneous input responsiveness, and a calm, distractions-free test environment.
2. **Reduced Motion Compliance:** When `prefers-reduced-motion: reduce` is detected via OS/browser telemetry, all durations fold to `0ms` or minimal cross-fades, and Lenis hardware-smoothed scrolling and custom cursor tracking are automatically bypassed in favor of native instant layout rendering.
