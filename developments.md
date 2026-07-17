# Project Development Ledger

---

## 1. System Deployment & Command History

Below is the compilation of workspace commands, scripts, setup tasks, and deployment patterns executed or configured throughout the system's life cycle.

### Package & Development Commands
* **Workspace Initial Installation:**
  ```bash
  npm install
  ```
  Deploys Next.js, React 18, Supabase SDKs, Google Generative AI SDK, Vercel AI SDK, Upstash Ratelimit, and PWA configurations.
* **Local Server Bootstrapping:**
  ```bash
  npm run dev
  ```
  Starts local Next.js development server bound to `http://localhost:3000`.
* **Production Build Verification:**
  ```bash
  npm run build
  ```
  Generates production-grade statically optimized routes, skips ESLint errors based on config parameters.
* **Linter Validation:**
  ```bash
  npm run lint
  ```
  Runs ESLint rules across the source directories.

### Testing Execution Commands
* **Playwright Suite Runner:**
  ```bash
  npx playwright test
  ```
  Runs E2E validation against Desktop Chrome, Desktop Firefox, Desktop Safari, and Pixel 5 viewports (with `slowMo: 100` delay config).
* **Targeted E2E Spec Run:**
  ```bash
  npx playwright test tests/golden-path.spec.ts
  ```
  Runs the main golden path flow E2E test.
* **Playwright UI Debugging:**
  ```bash
  npx playwright test --ui
  ```
  Opens the interactive testing console.

### Database Migration & Configuration Steps
The database configuration scripts must be run sequentially in the Supabase SQL editor:
1. **Core Schema Setup & Basic Policies:**
   Execute [rls_policies.sql](file:///d:/Project-EG/exampilot/rls_policies.sql) to enable Row Level Security (RLS) on all core tables and restrict client select privileges on sensitive answers:
   ```sql
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   REVOKE SELECT (correct_index) ON question_bank FROM authenticated;
   REVOKE SELECT (correct_index) ON question_bank FROM anon;
   ```
2. **Defense in Depth Integrity Updates:**
   Execute [defense_in_depth_rls.sql](file:///d:/Project-EG/exampilot/defense_in_depth_rls.sql) to re-evaluate and enforce mathematically isolated checks on `user_profiles`, `mock_attempts`, and `study_plans`.
3. **Mock Attempts Constraint Migration:**
   Execute the unique key patch from [database_optimizations.sql](file:///d:/Project-EG/exampilot/database_optimizations.sql):
   ```sql
   ALTER TABLE mock_attempts ADD CONSTRAINT unique_user_exam_test_number UNIQUE (user_id, exam_target, test_number);
   ```
4. **Leaderboard Materialized View & RPC Instantiation:**
   Execute the ranking setup inside [database_optimizations.sql](file:///d:/Project-EG/exampilot/database_optimizations.sql) to build `mock_leaderboards` and establish concurrent refresh routines.
5. **Account Deletion & Recovery Migration:**
   Execute [account_deletion_migration.sql](file:///d:/Project-EG/exampilot/account_deletion_migration.sql) to inject grace window columns:
   ```sql
   ALTER TABLE user_profiles ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE, ADD COLUMN deletion_deadline TIMESTAMPTZ;
   ```
6. **Current Affairs Relevance Score Migration:**
   Execute [add_score.sql](file:///d:/Project-EG/exampilot/add_score.sql):
   ```sql
   ALTER TABLE news_cache ADD COLUMN exam_relevance_score INTEGER DEFAULT 0;
   ```
7. **Legal Consent Tracking Migration:**
   Execute [legal_consent_migration.sql](file:///d:/Project-EG/exampilot/legal_consent_migration.sql):
   ```sql
   ALTER TABLE user_profiles ADD COLUMN legal_consent_version VARCHAR(50), ADD COLUMN legal_consent_timestamp TIMESTAMP WITH TIME ZONE;
   ```

---

## 2. Chronological Log of System Evolution

### Sprint Milestone 1: Initial Repository Structuring
* **Identifier/Context:** Initial Repository Structuring & Setup (`initial commit`)
* **Core File Modifications:**
  * Created project configuration files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
  * Added Next.js application root structure in `src/app`
* **Technical Changes Made:** Established the foundation of the Next.js 14 application with TypeScript, Tailwind CSS, and standard styling variables.
* **Terminal/Schema Logs:** Added baseline dependencies in `package.json` for React and Next.js.

---

### Sprint Milestone 2: Foundation & Core Database Configurations
* **Identifier/Context:** Database Integrity & UI Core Setup
* **Core File Modifications:**
  * Added [rls_policies.sql](file:///d:/Project-EG/exampilot/rls_policies.sql) for Row Level Security configurations.
  * Added database utility loaders in `src/utils/supabase/server.ts` and `src/utils/supabase/client.ts`.
  * Edited `src/components/TestRunner.tsx` and admin views to handle baseline questions.
* **Technical Changes Made:** Resolved database connection bottlenecks by isolating client-side and server-side Supabase initializations. Established baseline RLS rules so users can only access their own profiles and mock attempts.
* **Terminal/Schema Logs:** Enabled RLS across all tables. Revoked `correct_index` SELECT permissions from authenticated and anonymous users to prevent network-based question extraction.

---

### Sprint Milestone 3: Security Hardening & Server-Side Validation
* **Identifier/Context:** Server-Side CBT Verification & Credit Deductions (`778a12b`, `b277b97`, `778a12b`)
* **Core File Modifications:**
  * Edited [mockAttempts.ts](file:///d:/Project-EG/exampilot/src/app/actions/mockAttempts.ts) to verify user answers server-side.
  * Added `src/lib/creditManager.ts` to manage and deduct user credits.
  * Edited `src/lib/adminAuth.ts` and `src/lib/adminClient.ts` to secure admin privileges.
* **Technical Changes Made:** Fixed critical security loopholes by moving CBT scoring from client-side calculations to the server. The server now queries correct indexes using the service role bypass key (`SUPABASE_SERVICE_ROLE_KEY`) to compare answers, preventing client-side score injection.
* **Terminal/Schema Logs:** Configured composite unique key constraint `unique_user_exam_test_number` on `mock_attempts` to prevent duplicate test entries from network lag.

---

### Sprint Milestone 4: Chat Integration & JSON Parser Improvements
* **Identifier/Context:** AI Tutor Stream & Prompt Failsafes (`daa296c`, `acddf74`, `85724cb`, `7b1bc9b`, `070e633`)
* **Core File Modifications:**
  * Added `src/app/api/chat/route.ts` using the Vercel AI SDK.
  * Added `src/lib/robustJsonParse.ts` to improve JSON response handling.
  * Edited `src/components/FloatingAssistant.tsx` and custom hooks.
* **Technical Changes Made:** Added a streaming chat system using `gemini-3.1-flash-lite`. Handled JSON formatting issues in Gemini responses by implementing `robustJsonParse` to clean markdown wrappers and trailing commas.
* **Terminal/Schema Logs:** Updated environment variables to include the `GEMINI_API_KEY`.

---

### Sprint Milestone 5: E2E Testing & Command Center Setup
* **Identifier/Context:** Reticle SDK & Playwright Suite Integration (`b84fd35`, `a84bcbe`)
* **Core File Modifications:**
  * Added [playwright.config.ts](file:///d:/Project-EG/exampilot/playwright.config.ts) for testing setups.
  * Added [golden-path.spec.ts](file:///d:/Project-EG/exampilot/tests/golden-path.spec.ts).
  * Added admin seeding configurations in `src/app/actions/adminSeedQuestions.ts`.
* **Technical Changes Made:** Integrated Reticle and Playwright. The testing suite uses a mock session cookie (`sb-vdcmwlkbcisnidtubmnb-auth-token`) to bypass authentication, allowing automated tests to run without manual login.
* **Terminal/Schema Logs:** Added `@playwright/test` and `@reticlehq/next` to `devDependencies`.

---

### Sprint Milestone 6: News Pipeline & Performance Optimizations
* **Identifier/Context:** News Feed Timeout Resolves & Aggregation (`cee1fd0`, `9902d70`, `047d92c`)
* **Core File Modifications:**
  * Added `src/app/api/cron/fetch-news/route.ts` to fetch and process news.
  * Edited `src/app/actions/fetchDefenseNews.ts` to handle parallel article fetches.
  * Edited `src/components/NewsFeed.tsx` to build a snap-scrolling layout.
* **Technical Changes Made:** Fixed Vercel Hobby timeouts (10-second serverless execution limits) by reducing GNews query batch sizes from 20 to 5. Optimized article processing by running Gemini summary tasks in parallel.
* **Terminal/Schema Logs:** Configured cron tasks secured by `CRON_SECRET` headers. Updated the database schema to add `exam_relevance_score` to the `news_cache` table.

---

### Sprint Milestone 7: Plan Adjustments & Dashboard Redesign
* **Identifier/Context:** Exam Target Selection & Streak Math (`d53ccfa`, `566073e`, `b3cfb0b`)
* **Core File Modifications:**
  * Edited `src/app/page.tsx` (Dashboard) and `src/components/CreatePlanForm.tsx`.
  * Edited `src/app/actions/getStreak.ts` to fix streak math.
  * Edited `src/middleware.ts` to improve session cookie handling.
* **Technical Changes Made:** Redesigned the target exam selector into card elements. Standardized user streak calculations by converting active timestamps to Indian Standard Time (IST, UTC+5:30) before day-difference checks, resolving timezone boundary issues.
* **Terminal/Schema Logs:** Fixed profile initialization bugs where default credits set in `creditManager.ts` (500) did not match metadata (50).

---

### Sprint Milestone 8: CDS Implementation & Monetization Sprints
* **Identifier/Context:** CDS Support, Beta Quotas, and Feedback Loop (`c828039`)
* **Core File Modifications:**
  * Edited `src/lib/examConfig.ts` to add subject counts for CDS mocks.
  * Edited `src/lib/creditManager.ts` to enforce beta limits.
  * Added feedback form views.
* **Technical Changes Made:** Expanded support to include CDS mock configurations (+3/-1 scoring rules). Enforced beta quota limits, prompting users when they exceed their beta usage allocation.
* **Terminal/Schema Logs:** Added support for CDS questions inside `question_bank`.

---

### Sprint Milestone 9: Onboarding Tour, Guest Shield, Account Deletion Lifecycle, and Legal Sweep
* **Identifier/Context:** Onboarding Tours, Guest Shields, Account Deletion Cycles, and Legal Compliance (`224b7ca`)
* **Core File Modifications:**
  * **Onboarding & Tour Engine:** Created [OnboardingContext.tsx](file:///d:/Project-EG/exampilot/src/context/OnboardingContext.tsx), [OnboardingOverlay.tsx](file:///d:/Project-EG/exampilot/src/components/onboarding/OnboardingOverlay.tsx), [OnboardingStepCard.tsx](file:///d:/Project-EG/exampilot/src/components/onboarding/OnboardingStepCard.tsx), [GuestMockTest.tsx](file:///d:/Project-EG/exampilot/src/components/onboarding/GuestMockTest.tsx), [ConversionWall.tsx](file:///d:/Project-EG/exampilot/src/components/onboarding/ConversionWall.tsx), and [OnboardingTrigger.tsx](file:///d:/Project-EG/exampilot/src/components/onboarding/OnboardingTrigger.tsx). Modified [layout.tsx](file:///d:/Project-EG/exampilot/src/app/layout.tsx) and [page.tsx](file:///d:/Project-EG/exampilot/src/app/page.tsx).
  * **Guest Shield System:** Created [guestShield.ts](file:///d:/Project-EG/exampilot/src/lib/guestShield.ts) and [mockData.ts](file:///d:/Project-EG/exampilot/src/lib/mockData.ts). Modified [mockAttempts.ts](file:///d:/Project-EG/exampilot/src/app/actions/mockAttempts.ts), [planner.ts](file:///d:/Project-EG/exampilot/src/app/actions/planner.ts), [chat/route.ts](file:///d:/Project-EG/exampilot/src/app/api/chat/route.ts), and [coach/route.ts](file:///d:/Project-EG/exampilot/src/app/api/coach/route.ts) to intercept AI routes. Modified [practice/page.tsx](file:///d:/Project-EG/exampilot/src/app/practice/page.tsx) and [planner/page.tsx](file:///d:/Project-EG/exampilot/src/app/planner/page.tsx) to prevent unauthenticated client redirects for guests.
  * **Account Deletion Lifecycle:** Created [account_deletion_migration.sql](file:///d:/Project-EG/account_deletion_migration.sql), [deleteAccount.ts](file:///d:/Project-EG/exampilot/src/app/actions/deleteAccount.ts), [recoverAccount.ts](file:///d:/Project-EG/exampilot/src/app/actions/recoverAccount.ts), [DeleteAccountForm.tsx](file:///d:/Project-EG/exampilot/src/components/DeleteAccountForm.tsx), [recover/page.tsx](file:///d:/Project-EG/exampilot/src/app/settings/recover/page.tsx), and [cron/purge/route.ts](file:///d:/Project-EG/exampilot/src/app/api/cron/purge/route.ts). Modified [settings/page.tsx](file:///d:/Project-EG/exampilot/src/app/settings/page.tsx) and [middleware.ts](file:///d:/Project-EG/exampilot/src/middleware.ts).
  * **Legal Sweeps:** Modified [privacy_policy.md](file:///d:/Project-EG/exampilot/docs/legal/privacy_policy.md), [terms_of_service.md](file:///d:/Project-EG/exampilot/docs/legal/terms_of_service.md), [acceptable_use_policy.md](file:///d:/Project-EG/exampilot/docs/legal/acceptable_use_policy.md), [cookie_policy.md](file:///d:/Project-EG/exampilot/docs/legal/cookie_policy.md), [refund_cancellation_policy.md](file:///d:/Project-EG/exampilot/docs/legal/refund_cancellation_policy.md), and [LegalFooter.tsx](file:///d:/Project-EG/exampilot/src/components/LegalFooter.tsx).
* **Technical Changes Made:**
  * **Zero-Bundle Onboarding:** Implemented a state-driven portal overlay tour (Welcome -> Practice -> Trial Mock Test -> Conversion Wall) using React Context, bypassing third-party dependencies like `react-joyride`.
  * **AI Resource Guest Shield:** Created a cookie-based bypass (`onboarding_guest=true`) allowing unauthenticated access to the Practice Hub and Planner. Intercepted outgoing LLM endpoint calls (chat, coach, and planner) to serve structured premium mock datasets/streams directly rather than calling the Gemini API.
  * **Deletion & Recovery Pipeline:** Established a 48-hour account deletion cycle. Flagged accounts are restricted in `middleware.ts` and redirected to `/settings/recover` displaying a countdown. Cleansed expired accounts via an automated cron job API matching a secure `CRON_SECRET` Bearer token.
  * **Legal Compliance Re-brand:** Replaced all generic contact placeholders with "Pranay Rishi" and "atpr3105@gmail.com" across all legal documents, and detailed the 48-hour deletion grace protocol in the Privacy Policy.
  * **Build & Compilation Fix:** Removed unsupported `lucide-react` library dependencies from the newly added recovery view and injected lightweight native inline SVGs to maintain a clean Next.js production build.
* **Terminal/Schema Logs:**
  * Executed `git add .` and pushed commit `224b7ca`.
  * Verified full production build successfully compiled with Next.js static page generations via `npm run build`.
  * Configured `is_deleted` (boolean) and `deletion_deadline` (timestamptz) columns inside Supabase's `user_profiles` schema.

---

## 3. Configuration & Dependency Audit Log

### Library Audits

| Dependency | Phase Added / Shifted | Technical Reason / Purpose |
|---|---|---|
| `next` (`14.2.35`) | Initial Commit | Core application framework. |
| `@supabase/supabase-js` | Initial Commit | Client-side and server-side DB client. |
| `@supabase/ssr` (`0.12.0`) | Sprint Milestone 2 | Replaced legacy auth-helpers to support server-side cookie refreshes. |
| `@google/generative-ai` | Sprint Milestone 4 | Baseline SDK used for structured Study Plan generations. |
| `ai` (`7.0.26`) | Sprint Milestone 4 | Vercel AI SDK used for streaming chat assistant responses. |
| `@ai-sdk/google` (`4.0.14`) | Sprint Milestone 4 | Connector between Vercel AI SDK and Google Gemini models. |
| `@ducanh2912/next-pwa` | Sprint Milestone 2 | Configures PWA caching for offline mock runs. |
| `@reticlehq/next` (`2.0.0`) | Sprint Milestone 5 | Analytics and debugging tools for Next.js. |
| `@playwright/test` (`1.61.1`)| Sprint Milestone 5 | Integration testing suite. |
| `@upstash/ratelimit` | Sprint Milestone 3 | Limits API abuses on auth endpoints. |
| `@vercel/kv` | Sprint Milestone 3 | Redis store used by Upstash rate limiters. |

### Security Implementations Evolution
* **Baseline Security:** Authenticated users were initially granted standard access to database tables.
* **CBT Scoring Security (Anti-Cheating):** Standard users had SELECT privileges revoked on `correct_index`. Test results are graded on the server using a service role bypass client.
* **Zero-Day Admin Verification:** Administrative actions verify caller emails against the `admin_whitelist` table, rejecting requests from unauthorized accounts.
* **Middleware Interceptors:** Session cookie refreshes run on every request. Deletion grace periods and legal consent checks are enforced at the middleware level, blocking access to downstream routes.
