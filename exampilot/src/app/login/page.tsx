"use client";

import { useTransition, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithOtp, signUpWithPassword } from "@/app/login/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormState = { error?: string; success?: boolean; pending?: boolean } | null;

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
      <span className="text-xs text-slate-700 font-medium tracking-wider">OR</span>
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
  const [step, setStep] = useState<"email" | "password">("email");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP / Magic link state
  const [isOtpPending, startOtpTransition] = useTransition();
  const [otpState, setOtpState] = useState<FormState>(null);

  // Password Sign Up state
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [passwordState, setPasswordState] = useState<FormState>(null);

  const isAnyLoading = isOtpPending || isPasswordPending;

  function handleEmailContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) return;
    setStep("password");
  }

  function handleMagicLink() {
    setOtpState(null);
    const formData = new FormData();
    formData.append("email", emailInput);
    startOtpTransition(async () => {
      const result = await signInWithOtp(null, formData);
      setOtpState(result);
    });
  }

  function handlePasswordSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordState(null);
    if (passwordInput.length < 8) return;
    const formData = new FormData();
    formData.append("email", emailInput);
    formData.append("password", passwordInput);
    startPasswordTransition(async () => {
      const result = await signUpWithPassword(null, formData);
      // A bare success (no `pending`) means an existing user was signed in and
      // the session cookie is now set server-side. A full-page navigation is
      // required so middleware re-reads the fresh cookie and routes past /login;
      // a client-side router.push would not carry the new session reliably.
      if (result?.success && !result.pending) {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        window.location.assign(next && next.startsWith("/") ? next : "/");
        return;
      }
      setPasswordState(result);
    });
  }

  if (step === "email") {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex flex-col gap-3">
          <a
            href="/auth/login"
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] z-20 relative"
            style={{ minHeight: "52px" }}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </a>
        </div>

        <OrDivider />

        <form onSubmit={handleEmailContinue} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-entry" className="text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email-entry"
              type="email"
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
              inputMode="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="ep-input text-base" // Larger text for mobile
            />
          </div>

          <button
            type="submit"
            disabled={!emailInput || !emailInput.includes("@")}
            className="ep-btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Email
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 mt-2 leading-relaxed">
          By continuing, you agree to our <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms of Service</a>, <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</a>, and confirm you are 18 or older.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <button 
        onClick={() => setStep("email")}
        className="self-start text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 -ml-1 py-1 px-2 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-gray-600">Signing in as</p>
        <p className="text-base font-semibold text-gray-900 truncate">{emailInput}</p>
      </div>

      {otpState?.success ? (
        <Toast type="success" message="Check your email! We sent you a magic link — it expires in 10 minutes." />
      ) : passwordState?.pending ? (
        <Toast type="success" message="Account created! Check your email to verify your address before signing in." />
      ) : (
        <>
          <form onSubmit={handlePasswordSignUp} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pwd-entry" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="pwd-entry"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isAnyLoading}
                  className={`ep-input text-base pr-10 ${passwordInput.length > 0 && passwordInput.length < 8 ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              
              {passwordInput.length > 0 && passwordInput.length < 8 && (
                <span className="text-xs text-red-600 font-medium">Password must be at least 8 characters.</span>
              )}
            </div>

            {passwordState?.error && passwordState.error.startsWith("BREACHED_PASSWORD") && (
              <div className="bg-red-50 text-red-800 rounded-lg p-3 text-sm flex items-start gap-2 border border-red-200">
                <span className="text-base leading-tight">🚨</span>
                <p><strong>Data Breach Detected:</strong> {passwordState.error.replace("BREACHED_PASSWORD: ", "")}</p>
              </div>
            )}
            
            {passwordState?.error && !passwordState.error.startsWith("BREACHED_PASSWORD") && (
              <Toast type="error" message={passwordState.error} />
            )}

            <button
              type="submit"
              disabled={isPasswordPending || (passwordInput.length > 0 && passwordInput.length < 8)}
              className="ep-btn-primary w-full py-3.5 text-base bg-slate-800 hover:bg-slate-900 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasswordPending ? (
                <><Spinner light /><span>Signing In...</span></>
              ) : (
                <span>Sign In / Create Account</span>
              )}
            </button>
          </form>

          <OrDivider />

          <div className="flex flex-col items-center">
            {otpState?.error && <div className="w-full mb-3"><Toast type="error" message={otpState.error} /></div>}
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={isOtpPending}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isOtpPending ? <Spinner /> : null}
              Send a magic link instead
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [deletedAccount, setDeletedAccount] = useState(false);

  useEffect(() => {
    if (document.cookie.includes("account_deleted=true")) {
      setDeletedAccount(true);
      document.cookie = "account_deleted=; max-age=0; path=/"; // clear it
    }
  }, []);

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

      {/* Account Deletion Banner */}
      {deletedAccount && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm font-medium animate-fade-in flex items-start gap-3 shadow-sm z-20 relative">
          <span className="text-base leading-5 flex-shrink-0" aria-hidden="true">✅</span>
          <p>Your account has been successfully scheduled for deletion.</p>
        </div>
      )}

      {/* URL-level error from /auth/callback */}
      <Suspense>
        <UrlError />
      </Suspense>

      {/* Auth form card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-5 relative z-20">
        <LoginForm />
      </div>

      {/* Fine print */}
      <p className="text-center text-xs text-slate-700 leading-relaxed">
        We are committed to protecting your personal data.
      </p>
    </div>
  );
}
