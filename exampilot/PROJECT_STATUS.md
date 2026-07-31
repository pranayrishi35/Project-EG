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
