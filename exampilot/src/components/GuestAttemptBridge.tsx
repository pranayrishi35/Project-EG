"use client";

import { useEffect, useState } from "react";
import { bridgeGuestAttempt } from "@/app/actions/bridgeGuestAttempt";

export default function GuestAttemptBridge() {
  const [bridged, setBridged] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("exampilot_guest_attempt");
    if (!saved) return;

    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem("exampilot_guest_attempt");
      return;
    }

    if (!parsed || Object.keys(parsed.selectedAnswers || {}).length === 0) {
      // Nothing to actually save
      localStorage.removeItem("exampilot_guest_attempt");
      return;
    }

    const bridgeData = async () => {
      const result = await bridgeGuestAttempt(parsed);
      if (result.success) {
        localStorage.removeItem("exampilot_guest_attempt");
        setBridged(true);
        // Hide the banner after a few seconds
        setTimeout(() => setBridged(false), 8000);
      } else {
        console.error("Failed to bridge guest attempt:", result.error);
      }
    };

    bridgeData();
  }, []);

  if (!bridged) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
        🎉
      </div>
      <div>
        <h3 className="text-sm font-bold text-emerald-900">Your demo mock has been saved to your profile!</h3>
        <p className="text-xs text-emerald-700 mt-1">We've securely linked your guest progress. Your baseline score is preserved and ready for you.</p>
      </div>
    </div>
  );
}
