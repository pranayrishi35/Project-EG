"use client";

import { useTransition, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle, signInWithOtp } from "@/app/login/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = { error?: string; success?: boolean } | null;

// ─── Google SVG Logo ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.68 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.68-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.34-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.34 5.7c1.74-5.2 6.59-9.07 12.32-9.07z" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={[
        "w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0",
        light ? "border-white/30 border-t-white" : "border-gray-300 border-t-indigo-500",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in",
        type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : "bg-red-50 border border-red-200 text-red-700",
      ].join(" ")}
    >
      <span className="text-base leading-5 flex-shrink-0" aria-hidden="true">
        {type === "success" ? "✅" : "⚠️"}
      </span>
      <p className="leading-snug">{message}</p>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400 font-medium tracking-wider">OR</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── URL error reader (needs Suspense because useSearchParams suspends) ────────
function UrlError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;
  return <Toast type="error" message={decodeURIComponent(error)} />;
}

// ─── Main Login Form ──────────────────────────────────────────────────────────
function LoginForm() {
  // Consent state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(false);

  // Google OAuth state
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [googleError, setGoogleError] = useState<string | null>(null);

  // OTP / Magic link state — simple useState + useTransition (React 18 compatible)
  const [isOtpPending, startOtpTransition] = useTransition();
  const [otpState, setOtpState] = useState<FormState>(null);

  const isAnyLoading = isGooglePending || isOtpPending;

  // ── Google handler ──────────────────────────────────────────────────────────
  function handleGoogleSignIn() {
    setGoogleError(null);
    startGoogleTransition(async () => {
      const result = await signInWithGoogle();
      // signInWithGoogle calls redirect() on success — if we get a return value it errored
      if (result?.error) setGoogleError(result.error);
    });
  }

  // ── OTP handler ────────────────────────────────────────────────────────────
  function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOtpState(null);
    const formData = new FormData(e.currentTarget);
    startOtpTransition(async () => {
      const result = await signInWithOtp(null, formData);
      setOtpState(result);
    });
  }

  return (
    <>
      {/* ── Consent Checkboxes ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isAnyLoading}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            />
          </div>
          <span className="text-xs text-gray-600 leading-snug">
            I agree to the <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              checked={agreedToAge}
              onChange={(e) => setAgreedToAge(e.target.checked)}
              disabled={isAnyLoading}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            />
          </div>
          <span className="text-xs text-gray-600 leading-snug">
            I am 18 or older, or I have verifiable parental/guardian consent.
          </span>
        </label>
      </div>

      {/* ── Google OAuth button ──────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <button
          id="google-sign-in-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isAnyLoading || !agreedToTerms || !agreedToAge}
          aria-label="Continue with Google"
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ minHeight: "52px" }}
        >
          {isGooglePending ? <Spinner /> : <GoogleIcon />}
          <span>{isGooglePending ? "Redirecting to Google…" : "Continue with Google"}</span>
        </button>

        {googleError && <Toast type="error" message={googleError} />}
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <OrDivider />

      {/* ── Magic Link form ──────────────────────────────────────── */}
      <section aria-labelledby="magic-link-label">
        <p id="magic-link-label" className="text-sm font-semibold text-gray-700 mb-3">
          Or send a magic link to your email
        </p>

        {otpState?.success ? (
          <Toast
            type="success"
            message="Check your email! We sent you a magic link — it expires in 10 minutes."
          />
        ) : (
          <form
            id="magic-link-form"
            onSubmit={handleMagicLink}
            className="flex flex-col gap-3"
            noValidate
          >
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                inputMode="email"
                disabled={isOtpPending}
                className="ep-input disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {otpState?.error && <Toast type="error" message={otpState.error} />}

            <button
              id="send-magic-link-btn"
              type="submit"
              disabled={isOtpPending || !agreedToTerms || !agreedToAge}
              className="ep-btn-primary"
              style={isOtpPending ? { opacity: 0.7, transform: "none", boxShadow: "none", cursor: "not-allowed" } : {}}
              aria-label="Send magic link to your email"
            >
              {isOtpPending ? (
                <><Spinner light /><span>Sending…</span></>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="flex flex-col gap-5 p-4 pt-6 pb-8">

      {/* Hero banner */}
      <div
        className="relative rounded-2xl p-6 text-white overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)" }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #A5B4FC, transparent 70%)" }} aria-hidden="true" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #C4B5FD, transparent 70%)" }} aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Welcome back</p>
        <h1 className="relative text-2xl font-bold leading-tight mb-1">Sign in to ExamPilot</h1>
        <p className="relative text-sm opacity-75">Your personalised study planner awaits.</p>
      </div>

      {/* URL-level error from /auth/callback */}
      <Suspense>
        <UrlError />
      </Suspense>

      {/* Auth form card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-5">
        <LoginForm />
      </div>

      {/* Fine print */}
      <p className="text-center text-xs text-gray-400 leading-relaxed">
        We are committed to protecting your personal data.
      </p>
    </div>
  );
}
