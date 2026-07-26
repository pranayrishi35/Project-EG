# ExamPilot — The Council: Full-Spectrum Risk & Failure Audit

## Purpose

Identify every meaningful way ExamPilot could break, be exploited, lose a user's trust, or create legal exposure — across security, data privacy, UI/UX, error handling, legal/compliance, and business continuity. This is a standalone audit phase, separate from and complementary to the v5 feature phases (5–8). Treat it as **Phase 9 — Risk & Resilience Audit**, run either alongside Phase 7 or immediately after it.

**Ground rule that overrides everything else in this document: every finding must be grounded in something actually found in the repository — a specific file, a specific line, a reproducible test, or an actual screenshot — not a generic security-checklist statement.** If a persona wants to raise "SQL injection risk" or "missing rate limiting" as a concern, it must first grep/read the actual code and either (a) point to the specific vulnerable line, or (b) explicitly label the finding `[UNVERIFIED HYPOTHESIS — requires codebase check]` and then go check it before it reaches the Chairman. Findings that are just restated best-practice checklists without evidence get discarded, not passed up — five generic lists is worse than one grounded one.

---

## Process

1. Each of the five Council personas below performs an **independent audit pass** against the live repository — reading real files, running real greps, executing real tests where relevant (build, existing Playwright suites, a fresh security probe if warranted).
2. Each persona works through **its assigned lens and its assigned categories** from the coverage checklist (Part 3) — this division of labor is how full coverage is guaranteed without five overlapping generic lists.
3. Each finding is logged with: **severity** (Critical / High / Medium / Low), **evidence** (file/line, repro steps, or screenshot), and **the persona's one-line take**.
4. The **Chairman** then reads all five audits, deduplicates overlapping findings, resolves disagreements, cross-checks against the Part 3 coverage checklist to confirm nothing was skipped, and produces the final severity-ranked master list.
5. **Nothing gets "fixed" during this phase.** This is audit-only — output is a findings report, not a set of edits. Fixes get triaged into their own follow-up phases once you've reviewed the report.

---

## Part 1 — The Five Personas

### 🔺 The Contrarian — adversarial, assume malice
**Mandate:** Assume every user is either a bad actor or a bug waiting to happen. Actively try to break the app rather than assess whether it "should" work.
- Attempt real exploit reasoning: can one authenticated user read/modify another user's exam attempt, plan, or account data (IDOR)? Can the `ALLOW_MOCK_AUTH`/auth-bypass pattern be re-triggered any other way? Can rate limits be evaded (IP spoofing via `X-Forwarded-For`, distributed requests)? Is any user input (admin search, plan generation prompts sent to the AI, booklet uploads) reflected or executed unsanitized?
- Look specifically for **exam integrity exploits**: can a user tamper with scores, replay a submitted attempt, or use dev tools to see correct answers before submitting?
- Check secrets: grep for API keys, tokens, or credentials accidentally committed anywhere in the repo (not just `.env` — also test scripts, comments, log files created during this project's own debugging sessions).
- Assign severity to every exploit path found, with the exact repro steps.

### 🧱 The First-Principles Thinker — rebuild the question from scratch
**Mandate:** Ignore what's already been built. Ask: for an app that stores a defense-exam aspirant's practice history, personal identifiers, and payment info (if any), what would "safe and trustworthy" actually require from zero? Then check whether the existing architecture meets that bar — don't just audit against the app's own assumptions.
- Re-derive the real data-sensitivity classification: what data does this app hold that would hurt a real person if leaked (name, contact info, exam performance history, payment details)? Is each category handled proportionate to its sensitivity, or is everything treated the same regardless of stakes?
- Question architectural assumptions inherited from earlier phases without re-litigating settled decisions: is client-side `localStorage` an appropriate place for anything sensitive (session/completion state is fine; anything else is worth flagging)? Is the Supabase Row-Level-Security policy set actually verified to match the intended access model, or only assumed?
- Check third-party data exposure: what user data gets sent to the AI provider (Gemini) for plan generation or the Tejas assistant — and is that disclosed anywhere to the user?

### 🌱 The Expansionist — find the gaps nobody's filled yet
**Mandate:** Look for what's structurally *missing*, not what's broken — the absence of something a regulator, a competitor, or a careful user would expect to exist.
- Legal/compliance gaps: is there a real Privacy Policy and Terms of Service, and do they accurately describe what the app actually does (not boilerplate)? Given this targets Indian defense-exam aspirants, does it need to address India's Digital Personal Data Protection Act (DPDP) obligations? Is there a clear disclaimer that ExamPilot is an independent prep tool, **not affiliated with or endorsed by** the UPSC, Indian Air Force, Army, or Navy (trademark/misrepresentation exposure if this isn't explicit)?
- Age/minor considerations: aspirants for NDA can be as young as 16–17. Does anything in data collection, marketing language, or account creation need special handling for users who may be minors?
- Monitoring/observability gaps: if the production auth-bypass guard, rate limiter, or payment flow (if any) silently failed in production right now, would anyone find out, or would it just quietly stop working? Is there any error-tracking/alerting service wired in at all?
- Business continuity: single points of failure (Supabase, Vercel, the AI provider) — if any one of these has an outage or the AI API key hits a billing cap, what does the user actually see? A graceful message, or a raw crash?

### 🔍 The Outsider — fresh eyes, zero project history
**Mandate:** Evaluate the app as if seeing it for the very first time, with no knowledge of what's already been fixed across Phases 0–6. Do not assume good faith from prior "verified" claims — independently re-check anything load-bearing.
- Walk the actual user-facing surfaces cold: landing page, `/welcome` funnel, sign-up, first mock test, error pages, empty states. Where would a real first-time user be confused, distrustful, or likely to quit?
- Specifically hunt for **error-handling and UX failure modes**: what happens on a failed network request mid-exam? A failed AI plan generation? An expired session mid-test? Does the user ever see a raw stack trace, a blank white screen, or a generic Next.js error page instead of an on-brand message?
- Check consistency the way a new user would notice it, not the way a developer would: does anything look or behave differently between the marketing site and the authenticated app in a way that would feel like two different products?

### ⚙️ The Executor — Monday-morning triage
**Mandate:** Take everything the other four personas found and ask only: what would I actually fix first, in what order, with what effort? No new findings — pure prioritization.
- For every finding from the other four, estimate rough effort (hours vs days) and blast radius (affects one user vs all users vs company legal exposure).
- Flag anything that's cheap to fix and dangerous to leave (these go first, regardless of category).
- Flag anything expensive and low-probability (these can wait, and should be named as accepted risk rather than silently deprioritized).

---

## Part 2 — Chairman Synthesis

The Chairman does not re-run the audit — it synthesizes what the five personas already found, evidence-checked, into one report:

1. **Deduplicate** — if the Contrarian and First-Principles Thinker both flag the same IDOR risk, merge into one entry, keep the strongest evidence.
2. **Resolve disagreements explicitly** — if personas disagree on severity, state both views and give a reasoned final call, don't just average them.
3. **Cross-check against the Part 3 coverage checklist** — go category by category and confirm every box was actually addressed by at least one persona with real evidence, not just implicitly assumed. Any category with zero grounded findings gets flagged as `NOT YET AUDITED`, not silently marked clean.
4. **Output format:**

| # | Category | Severity | Finding | Evidence | Owning Persona | Recommended Phase |
|---|---|---|---|---|---|---|
| 1 | Security | Critical | ... | file/line or repro | Contrarian | Immediate hotfix |

5. **No overall numeric score for this phase.** Unlike the Part 5 rubric used elsewhere in this project, a single "97/100" number is the wrong shape for a risk audit — a single Critical finding matters more than twenty Low ones, and a score would obscure that. Present the findings table, ranked by severity, instead.

---

## Part 3 — Coverage Checklist (Chairman must confirm every row was actually addressed)

- [ ] **Authentication & authorization** (including the existing `isMockAuthAllowed()` guard, RLS policies, session handling)
- [ ] **Injection / input handling** (AI prompt injection via user-supplied text, admin search, any form input)
- [ ] **Rate limiting & abuse prevention** (the Edge REST limiter's actual coverage — which routes are and aren't protected)
- [ ] **Secrets & credential hygiene** (repo-wide, including test/debug scripts created during this project)
- [ ] **Data privacy & third-party data sharing** (what reaches Supabase, Vercel, the AI provider, and what's disclosed)
- [ ] **Legal & compliance** (Privacy Policy, Terms of Service, exam-body disclaimer, minors/age handling)
- [ ] **Error handling & failure modes** (network failures, AI provider outages, mid-exam disconnects, SSR crashes)
- [ ] **UI/UX trust & clarity** (onboarding funnel, empty states, error states, first-time-user confusion points)
- [ ] **Accessibility** (screen reader/keyboard support beyond what's already been spot-checked in Phases 4–6)
- [ ] **Performance & scalability** (what breaks under real load, not just Fast-3G single-user timing)
- [ ] **Monitoring & observability** (would you find out if something silently broke in production right now)
- [ ] **Business continuity** (vendor outages, API cost overruns, single points of failure)
- [ ] **Exam integrity** (cheating/tampering vectors specific to a testing platform)

---

## Part 4 — Execution Instructions for Your Coding Agent

- Run each persona as a genuinely separate pass — don't let one persona's conclusions leak into another's investigation before the Chairman stage.
- Every finding needs evidence attached before it's allowed into the Chairman's table. A persona that can't find evidence for a suspicion should say so explicitly rather than asserting it as fact.
- This is a read-only audit phase — no code changes. Bring the completed findings table back for review before triaging any fixes into phases.
