# ExamPilot — Master Prompt v5: Immersive Landing, Onboarding Funnel & Trust Layer

This document extends v4 (do not discard it — the design system, color tokens, cursor/3D specs, and CBT motion-exclusion rule from v4 remain in force). v5 covers three new workstreams: a landing page reset toward one immersive theme with better scrolling craft, a from-scratch onboarding funnel to replace the embedded demo mock test, and a trust/credibility + language-accessibility layer the site currently lacks.

**Keep the same discipline that got Phases 0–4 to a real, verified finish**: phased execution, pause after each phase, run the Part 5 multi-agent debate + Chairman verdict (canonical six categories, 100 points, N/A where genuinely inapplicable — do not reinvent the rubric shape), real screenshots over prose claims, real grep/DOM evidence over self-report.

---

## PART 1 — Why this pass exists

The site is functionally solid and visually cleaned up (v4 closed real bugs: broken cursor, indigo/emoji leaks, an SSR crash, an auth-bypass hole). But three things are stopping it from feeling *captivating* and *trustworthy* to a first-time visitor:

1. **The landing page asks visitors to do the work of understanding it.** Jargon-forward copy (CBT, AFCAT/CDS/NDA used without explanation), a live embedded mock test that a skeptical first-timer has to stumble into rather than being guided through, and a scroll experience that's technically smooth (per v4's frame-suspension proof) but not *narratively* immersive — it reveals content, it doesn't tell a story.
2. **There is no guided path for a brand-new user.** Today, a signed-up user lands in the app with no walkthrough of what exists. The single best trust-building tool a study platform has — "let me show you exactly what you get before you commit" — currently lives as a buried demo widget on the landing page instead of as a first-class onboarding experience.
3. **There is no third-party trust signal anywhere.** No testimonials, no "who built this," no visible reason to believe an AI planner can actually help someone pass a competitive exam. Aesthetic polish alone doesn't establish credibility for a high-stakes use case.

---

## PART 2 — Language accessibility pass (applies sitewide, prioritize landing + funnel)

**Principle: write for a first-generation aspirant's parent, not for someone who already knows what a CBT is.**

- Replace insider terms in all *marketing and onboarding* copy: "CBT" → "practice test" or "timed test," "attempt" → "your test," "syllabus mapping" → "what to study and when."
- On first use of any exam acronym (AFCAT, CDS, NDA) on any marketing page, expand it once in plain language: e.g. "AFCAT (Air Force Common Admission Test)."
- Hero copy test: could someone with no prior exposure to defense-exam prep culture read the headline and subhead and understand *what this does* and *who it's for* in one pass? If not, rewrite.
- Inside the authenticated app (dashboard, practice, planner), technical terms are fine — that's an informed-user context. This pass is about the outward-facing funnel: landing, signup, onboarding.
- Do not dumb down actual exam content (practice questions, syllabus terms) — the simplification is about *platform* language, not *exam* language.

**Verification requirement:** before marking this done, have a fresh pair of eyes (or a agent role-playing "parent of a first-time aspirant with no context") read the landing page and onboarding copy end to end and flag anything unclear. Don't self-certify this one — plain language is exactly the kind of thing that's hard to judge from inside the project.

---

## PART 3 — Landing page reset: one immersive theme, better scroll craft, demo mock removed

### 3.1 Single theme, not competing visual modes
Audit the current landing page and identify every distinct visual "mode" in play (aviation HUD telemetry, glassmorphic panels, flat dashboard-style cards, etc.). Pick **one** cohesive visual metaphor and commit to it everywhere on the page — the existing aviation/flight-deck motif from v4 is the natural choice since the 3D hero and cursor already lean that way; don't introduce a second competing metaphor. Every section (not just the hero) should read as part of the same world.

### 3.2 Remove the embedded demo mock test
Delete `DemoTestRunner`'s embed from the landing page entirely — not hidden, not "still there but styled," fully removed from `GuestLanding.tsx`. Its function (letting a visitor *feel* the product before committing) moves to the onboarding funnel in Part 4, where it belongs and can do that job properly instead of being a buried widget competing for attention with everything else on the page.

Replace its landing-page slot with something that still earns trust without requiring the visitor to do a task: a short, honest preview — a few seconds of an actual practice-question card, a real (anonymized) score-improvement stat once you have one, or a single compelling "here's what your dashboard looks like" static/animated visual. Not a fake interactive demo — an honest glimpse.

### 3.3 Scroll craft: make it feel flawless, not just functional
v4 proved the 3D scene's frame-suspension logic works correctly (verified empirically). This phase is about *feel*, not correctness:
- Audit scroll-triggered reveals for consistent easing curves and timing across every section — inconsistent easing between sections is what makes scrolling feel like a stack of independent animations rather than one continuous experience.
- Consider a light scrollytelling structure for 2–3 key sections (e.g., the hero's 3D object rotating/repositioning as you scroll past it, a feature-highlight section where cards assemble into place rather than just fading in) — extend, don't replace, the existing Framer Motion/GSAP approach from v4. Don't introduce a second scroll library.
- Respect the existing `prefers-reduced-motion` handling from v4 — this must degrade to static content, not just slower motion.
- **Explicitly avoid the cheap-feeling failure modes v4 already fixed once**: no new decorative elements that don't track correctly, no motion added to one section that isn't extended sitewide, no scrollytelling that only works on the exact viewport it was screenshotted at.

### 3.4 Verification requirement
Screenshot the full landing page scroll sequence at 3–4 scroll depths, desktop and mobile, and confirm the visual story reads as one continuous, intentional sequence — not a checklist of independently-fine sections.

---

## PART 4 — New feature: guided onboarding funnel for first-time users

This is genuinely new scope, not a fix — treat it with the same rigor as the 3D hero build in v4 (its own phase, its own verification, its own performance budget).

### 4.1 Goal
A first-time user should be able to walk, step by step, through every core feature of the app *once*, in guided sequence, without needing to already know what the app does — and should come away either signed up or clearly understanding what signing up gets them.

### 4.2 Structure
- A dedicated route (e.g. `/welcome` or `/start`), entered via a clear landing-page CTA ("See how it works" / "Take the guided tour") — separate from a direct "Sign in" path, so returning users aren't forced through it.
- A visible step indicator (e.g. "Step 3 of 7") so users always know how much is left — critical for a walkthrough; open-ended tours lose people.
- Each step demonstrates exactly one feature with real (seeded/sample, not live database) data: e.g.
  1. Welcome + what ExamPilot is, in plain language
  2. Sample practice test — answer 2–3 real questions, see instant scoring (this is where the old demo mock's job lives now, properly framed as "try it yourself" rather than competing for hero-section attention)
  3. AI study planner — show a sample generated plan
  4. Dashboard — show sample progress/analytics
  5. News/current-affairs feed — show a sample entry
  6. Offline booklets — show what's available
  7. Flashcards — a quick sample card flip
  8. Tejas assistant — one sample interaction
- Each step: brief plain-language explanation, an interactive or visual sample, and clear forward/back/skip controls. Never trap the user — always allow skipping to signup or to the landing page.
- End state: a clear, single CTA to create an account, carrying forward context ("You just tried the planner — let's build your real one").
- Guest/sample state only — no real auth required to move through the funnel. If a user already has an account, detect that and offer a shorter "quick tour" or skip straight to sign-in.

### 4.3 Non-functional requirements
- Fully responsive; this will get heavy mobile traffic.
- Resumable within a session (don't lose progress on an accidental back-button or refresh).
- Accessible: keyboard-navigable step controls, ARIA live-region announcing step changes.
- Performance: sample data should be static/seeded, not live API calls per step — no reason for this to be network-heavy.
- CBT motion-exclusion rule still applies to the sample-practice-test step (Part 3.2 of v4) — no jet cursor or decorative motion while a user is answering sample questions, exactly as in the real exam UI.

### 4.4 Verification requirement
Walk the entire funnel start to finish in an automated test (Playwright: step through all N steps, confirm each renders its intended sample content, confirm skip/back work, confirm the final CTA is reachable) — and manually walk it once yourself as if you were a first-time visitor with no context, timing how long it takes and noting anywhere you'd have quit.

---

## PART 5 — Trust & credibility layer

None of this is visual polish — it's the layer that turns "looks nice" into "I believe this will help me."

- **Social proof**: even a small, honest set of testimonials or a simple stat ("X practice tests completed this month") beats nothing. Do not fabricate numbers or quotes — if you don't have real testimonials yet, use a placeholder pattern the team can swap in later, and say so explicitly rather than shipping invented quotes.
- **About/credibility section**: a short, plain-language explanation of who built this and why — doesn't need to be elaborate, needs to exist.
- **Visible support/FAQ path**: a findable way to ask a question or get help, even if it's just a simple FAQ accordion + an email link.
- **Data/privacy transparency**: a short, honest note on what's collected and why — appropriate given this handles real exam-prep activity and likely personal identifiers.
- **Differentiation statement**: one clear sentence, early on the landing page, on why this beats a PDF/YouTube-based prep approach.

---

## PART 6 — Visual consistency hardening

- Sweep the authenticated app's analytics/dashboard surfaces for raw Tailwind opacity utility classes (e.g. `bg-slate-900/50`) and convert to the semantic design tokens from v4 — this was disclosed as debt in the Phase 4 QA and should be paid down now rather than accumulating further.
- Reconcile `GuestLanding.tsx` and the authenticated home wrapper in `page.tsx` — the "minor container duplication" disclosed in Phase 4 is exactly the kind of divergence that produced the Tejas/CBT-bar bugs in Phase 0. Consolidate into a shared layout primitive where the two share styling, rather than maintaining parallel wrappers.
- Produce (or update) a single living style reference — even a simple internal page or README section listing every token, spacing value, and component variant in current use — so future work has one source of truth instead of re-deriving "what's on-brand" from grep sweeps each time.

---

## PART 7 — Phased execution plan

**Phase 5 — Landing page reset.** Execute Part 3 in full (single theme audit, demo mock removal, scroll craft pass) plus the Part 2 language pass on landing copy. Run Part 5 (debate + Chairman) from v4.

**Phase 6 — Onboarding funnel build.** Execute Part 4 in full, new feature build with its own performance budget and accessibility pass. Run Chairman verdict.

**Phase 7 — Trust layer + visual consistency hardening.** Execute Parts 5 and 6 of this document. Run Chairman verdict.

**Phase 8 — Final integrated QA.** Re-run the full Phase 4 sitewide QA suite (all routes, both viewports, widened color/console-error checks) to confirm nothing regressed, plus a full walkthrough of the new funnel. Run Chairman verdict treating the whole site as the subject.

Pause after each phase. Same standing rules as v4: verbatim evidence over summaries, real screenshots you personally check (not just described), no rubric reshaping, no shortcuts on the CBT motion-exclusion rule.

---

## PART 8 — Definition of Done (v5 addition to v4's list)

- [ ] Demo mock test fully removed from the landing page (not hidden, not restyled — gone)
- [ ] Landing page reads as one consistent visual theme throughout, not a mix of modes
- [ ] Scroll sequence reads as one intentional story across 3–4 depths, desktop and mobile
- [ ] Onboarding funnel exists, is reachable from the landing page, walks a new user through every core feature once, and ends in a clear signup CTA
- [ ] Funnel works fully as a guest (no auth required), is resumable, keyboard-accessible, and mobile-responsive
- [ ] Marketing/onboarding copy passes a plain-language read-through by someone with no prior context
- [ ] At least one trust-signal element (testimonial, stat, about section, or FAQ) is live and visible pre-signup
- [ ] Dashboard opacity-utility debt from Phase 4 is paid down to semantic tokens
- [ ] Guest/authenticated landing wrappers are reconciled, not left as parallel divergence risks
- [ ] Full Phase 4 QA suite re-passes with zero regressions
