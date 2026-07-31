"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * PlanLimitUpsell — shown when a non-premium user hits the single-plan limit.
 * (Part 1, Master Prompt v6)
 *
 * Non-punitive tone: "You've got one active plan" not "You've reached your limit."
 * The upsell is informative, not a wall — the user's current plan stays exactly
 * as it is.
 */
export default function PlanLimitUpsell() {
  return (
    <div
      role="alert"
      className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in"
    >
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
        <AlertCircle size={24} strokeWidth={2} className="text-amber-500" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-black text-amber-900 mb-1">
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          You've got one active plan
        </h2>
        <p className="text-sm text-amber-800 leading-relaxed">
          Upgrade to premium to run multiple exam tracks at once — your current plan stays exactly as it is. Premium also unlocks unlimited flashcards and priority AI responses.
        </p>
      </div>
      <Link
        href="/settings?tab=premium"
        className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
      >
        <Sparkles size={16} strokeWidth={2.5} aria-hidden="true" />
        Upgrade Now
      </Link>
    </div>
  );
}
