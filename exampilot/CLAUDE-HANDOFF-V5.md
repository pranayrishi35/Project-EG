# ExamPilot v5 — Claude Code Handoff & Governing Protocols (Phase 6 Complete -> Phase 7 Transfer)

Welcome, Claude Code. You are taking over engineering and verification for **ExamPilot v5**, an AI-powered study flight deck for defense and competitive examinations. 

You are picking up at the boundary between **Phase 6 (Onboarding Funnel Complete & Verified)** and **Phase 7 (Trust Layer Hardening & Token Discipline Cleanup)**. Before making a single edit for Phase 7, you are required to conduct an independent, cold-slate rebuild and empirical re-verification of the project to ensure no artifacts, dev cache contention, or hidden regressions persist.

---

## 1. Governing Documents & Required Reading
Before taking any action, you must read the actual governing specification and infrastructure files directly. Do not rely on chat history or verbal summaries:
1. **`exampilot-master-prompt-v5.md`**: The supreme governing specification for Phases 5 through 8, detailing the language accessibility pass, single theme commitments, onboarding funnel requirements, trust layer elements, and the canonical Definition of Done.
2. **`CLAUDE.md`, `DESIGN_SYSTEM.md`, and `context.md`**: Foundational repository rules, style token definitions, and technology constraints (pure Tailwind, zero external UI libraries like Shadcn/MUI, no React 19 hooks, NodeJS runtime enforcement for middleware).
3. **`next.config.mjs` & `playwright.prod.config.ts`**: The edge runtime sanitizer configuration and zero-eval production test runner.
4. **`verify-prod-infra.mjs`**: The automated rate-limiting N+1 burst and mock-auth leak scenario audit script.

---

## 2. Standing Rules of Engagement (Non-Negotiable Governing Law)
The user holds all agentic coding assistants to an exceptionally rigorous, zero-drift verification standard. You must strictly adhere to the following principles:

1. **Verbatim Evidence Over Prose Assertions:** Never claim that a search found zero matches, a build succeeded, or a test passed without pasting the exact terminal output, ripgrep match logs, HTTP headers, status codes, and DOM rendering text. "Don't trust that a check ran, see what it found."
2. **Personal Inspection of Visual Screenshots:** Always review generated Playwright screenshot artifacts directly for visual flaws, layout clipping, contrast breaks, responsive spacing bugs on mobile viewports, and stray emoji contamination.
3. **No Rubric Reshaping or Rubber-Stamping:** When evaluating phases with the **Chairman Verdict**, you must evaluate against the exact **Canonical Part 5 Six-Category Rubric** (100 total points). Never rename categories, merge buckets, or alter point maximums:
   - **Color / token discipline (20 pts)**
   - **Typography & spacing (15 pts)**
   - **Motion / interaction craft (20 pts)**
   - **Icon / component consistency, zero emoji (15 pts)**
   - **Sitewide coverage & responsive execution (15 pts)**
   - **Security, performance & DOM health (15 pts)**
   - *CRITICAL WARNING ON PERFECT SCORES:* The last two verification cycles achieved consecutive 100/100 scores. Do not default to a perfect score as a routine sign-off. Be actively skeptical, hunt for subtle technical debt or edge-case friction, and dock points honestly when imperfections exist.
4. **CBT Motion-Exclusion Rule:** During mock examination simulations and interactive CBT combat runs, decorative background motion, layout shifts, or distracting ambient animations are strictly prohibited to preserve high-focus simulation integrity.
5. **The `isMockAuthAllowed()` Double-Gate Security Guard:** In `src/lib/testAuthGuard.ts`, testing bypasses are restricted by a strict dual-check: `process.env.ALLOW_MOCK_AUTH === "true" && process.env.NODE_ENV !== "production"`. Under no circumstances may this guard be bypassed or altered to permit test tokens under `NODE_ENV=production`.
6. **Zero Emoji Contamination:** Keep the UI strictly professional using Lucide-react SVG iconography. Use broad Unicode regex checks (`/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u`) during code audits rather than narrow literal character alternations.
7. **Trust & Sample Data Labeling:** When displaying sample metrics in demonstration funnels (e.g., Steps 5 & 6 in `/welcome`), never present "invented precision" (e.g. unearned 88.4% accuracy) as if it were a user's real score. All sample telemetry must remain explicitly labeled as an **"(Illustrative Sample Schedule)"** or **"Illustrative Pilot Sample Telemetry &mdash; Values calibrate after your first completed drill. [DEMO MODE]"**.

---

## 3. Mandatory Cold Re-Verification Pass & Cold-Audit Report Gate

Before starting any Phase 7 work: (a) run a clean `npm run build` and confirm it compiles with zero eval-wrapped Edge bundles, as `next.config.mjs` intends; (b) re-execute `tests/phase4-fullsite-qa.spec.ts` and `tests/phase6-onboarding-funnel.spec.ts` in full and report actual pass/fail counts; (c) re-run `verify-prod-infra.mjs`'s two scenarios (N+1 burst, `ALLOW_MOCK_AUTH=true` leak) and paste the fresh output; (d) read `verify-prod-infra.mjs`'s source and confirm its assertions actually test what it claims. Produce a short written cold-audit report of anything that doesn't reproduce cleanly, and stop there for review before beginning any Phase 7 implementation.

### Step-by-Step Execution Sequence
Execute the following sequence in your terminal during your cold audit:

```powershell
# 1. Kill any lingering Node servers on ports 3001 and 4001
npx -y kill-port 3001; npx -y kill-port 4001

# 2. Obliterate old compiled cache for a pristine cold compilation
if (Test-Path .next) { Remove-Item -Recurse -Force .next }

# 3. Build optimized production bundle & confirm zero eval warnings
npm run build

# 4. Start live zero-eval production server under leak configuration in the background
$env:NODE_ENV='production'; $env:ALLOW_MOCK_AUTH='true'; $env:KV_REST_API_URL='http://127.0.0.1:8085'; $env:KV_REST_API_TOKEN='mock_secret_token'; npm run start -- -p 3001

# 5. Run automated N+1 rate limit and leak scenario security audit
node verify-prod-infra.mjs

# 6. Execute Playwright Phase 6 Onboarding Funnel verification against production server
npx playwright test tests/phase6-onboarding-funnel.spec.ts --config=playwright.prod.config.ts --project=chromium

# 7. Execute Phase 4 Fullsite QA verification suite
npx playwright test tests/phase4-fullsite-qa.spec.ts --config=playwright.prod.config.ts --project=chromium

# 8. Gracefully terminate server on port 3001 when tests complete
npx -y kill-port 3001
```

**STOP HERE:** Present your short written cold-audit report summarizing what re-ran clean, what did not reproduce, and any discrepancies between prior claims and fresh empirical proof. Do not commence Phase 7 design or implementation until the user reviews and approves your report.

---

## 4. Upcoming Scope: Phase 7 (Trust Layer & Token Hardening)
Once your cold-audit report is reviewed and signed off by the user, proceed to execute Phase 7 as outlined in Part 5, Part 6, and Part 7 of `exampilot-master-prompt-v5.md`:
1. **Token Discipline Audit:** Run a comprehensive ripgrep survey across `src/` for ad-hoc opacity utilities and arbitrary hex values (e.g. `bg-slate-900/40`, `border-slate-800/60`). Reconcile and clean up these ad-hoc modifiers by mapping them to standardized canonical design system tokens in `DESIGN_SYSTEM.md` and `tailwind.config.ts`.
2. **Trust Layer Enhancements:** Review site-wide trust signals, credibility explanations ("who built this and why"), findable support/FAQ accordions, data/privacy transparency notes, and clear differentiation statements without removing or impairing your strongest conversion driver—the interactive diagnostic mock test integrated into Step 2 of the `/welcome` onboarding funnel.
3. **Chairman Verdict Gate:** Submit your completed Phase 7 changes to a merciless, honest Chairman verdict scoring pass against the canonical six categories. Ensure all findings are backed by verbatim diagnostic logs and personally verified screenshot photography.

---

## 5. Phase 9 — The Council: Full-Spectrum Risk & Failure Audit

After Phase 7 (or alongside it, at the user's discretion), execute the comprehensive risk audit defined in **`the-council-audit-phase9.md`**. This is a **read-only audit phase** — no code changes are permitted. Key execution rules:

1. **Read `the-council-audit-phase9.md` in full before starting.** It defines five independent audit personas (Contrarian, First-Principles Thinker, Expansionist, Outsider, Executor) plus a Chairman synthesis stage.
2. **Run each persona as a genuinely separate pass.** Do not let one persona's conclusions leak into another's investigation before the Chairman stage. Each persona has assigned categories from the 13-row coverage checklist in Part 3 of that document.
3. **The ground rule that overrides everything: every finding must be grounded in something actually found in the repository** — a specific file, a specific line, a reproducible test, or an actual screenshot. Generic security-checklist items without evidence get discarded, not passed up. If a persona suspects something but can't find evidence, it must label the finding `[UNVERIFIED HYPOTHESIS — requires codebase check]` and then go check it before it reaches the Chairman.
4. **No numeric score.** Unlike the Part 5 Chairman verdict used for feature phases, Phase 9 outputs a severity-ranked findings table (Critical / High / Medium / Low), not a point total. A single Critical finding matters more than twenty Low ones.
5. **Output is a findings report, not a set of edits.** Bring the completed Chairman synthesis table back for user review. Fixes get triaged into follow-up phases only after the user reviews the report.
