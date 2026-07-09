"use client";

import { useTransition } from "react";
import { signOut } from "@/app/login/actions";

interface SignOutButtonProps {
  /** When true, renders as a full-width red button (used in Settings). */
  fullWidth?: boolean;
}

/**
 * SignOutButton — thin client component that calls the signOut server action.
 * Kept separate so Header/Settings stay Server Components (no "use client" needed there).
 */
export default function SignOutButton({ fullWidth = false }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  if (fullWidth) {
    return (
      <button
        id="sign-out-btn"
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Sign out of ExamPilot"
        className={[
          "w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-6",
          "text-sm font-bold text-red-600 border-2 border-red-100 bg-red-50",
          "hover:bg-red-100 hover:border-red-200 transition-all duration-150",
          "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" aria-hidden="true" />
            Signing out…
          </>
        ) : (
          <>
            {/* Log-out icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </>
        )}
      </button>
    );
  }

  // Compact version (header)
  return (
    <button
      id="sign-out-btn"
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Sign out of ExamPilot"
      className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors duration-150 disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
