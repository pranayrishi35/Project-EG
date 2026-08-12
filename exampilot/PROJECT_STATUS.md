# Project Status & Accepted Risks

## Security Audits (NPM)
- **Next.js (v14.2.35) Vulnerabilities**: Several high-severity vulnerabilities affecting Next.js internal dependencies (e.g., Image Optimizer DoS, React Server Component cache poisoning, rewriting smuggling) remain unpatched. 
  - **Status:** ACCEPTED RISK.
  - **Reasoning:** Fixing these requires a major framework upgrade to Next.js v15/v16. Due to recent project instability (Phase 6 build-collapse, Sentry integration), a major upgrade is currently deemed too high-risk and will be scheduled as an isolated, dedicated sprint once the current deployment is stable.

- **Sub-dependencies patched via overrides:**
  - `serialize-javascript`
  - `postcss`
  - `brace-expansion` (minimatch)
  - `fast-uri`

## Environment Proxy & Server Action Blocker
- **Server Action Network Requests (Supabase, Sentry, AI SDK)**: Next.js 14 uses `undici` for its internal `fetch` API, which strictly enforces certificate validation and ignores `NODE_TLS_REJECT_UNAUTHORIZED`. In local environments utilizing an intercepting SSL proxy (e.g., Sophos Antivirus), all server-side `fetch` calls fail with `TypeError: fetch failed` due to `SELF_SIGNED_CERT_IN_CHAIN`, even when `NODE_EXTRA_CA_CERTS` is provided (as the proxy dynamically intercepts domains causing timeouts or mismatched certificate chains depending on the endpoint).
  - **Status:** ACCEPTED RISK.
  - **Impacted Verifications:**
    - Doubts Board: Rate Limiting validation (Server Action) — **Cannot Verify From This Environment**
    - Doubts Board: PII Moderation validation (Server Action) — **Cannot Verify From This Environment**
    - FloatingAssistant: Interactivity test (AI SDK edge API route) — **Cannot Verify From This Environment**
  - **Reasoning:** Extensive frontend unit checks and `curl` tests directly against the Supabase RLS policies successfully passed (specifically, verifying that anonymous reads and writes are blocked. Per-owner cross-user write restrictions remain pending). The functional test failures are strictly limited to the Next.js Dev Server's execution environment due to the proxy's self-signed injection. These functions will be verified post-deployment on the CI/staging environment.
