"use client";

import { useState, useTransition } from "react";
import { acceptConsent } from "./actions";

export default function ConsentPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms || !agreedToAge) return;

    setError(null);
    startTransition(async () => {
      const result = await acceptConsent();
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.assign("/practice");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Legal Updates</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Before you can access ExamPilot, please review and accept our updated Terms of Service and Privacy Policy.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Checkbox 1 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <span className="text-sm text-gray-700">
              I agree to the <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </span>
          </label>

          {/* Checkbox 2 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={agreedToAge}
                onChange={(e) => setAgreedToAge(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <span className="text-sm text-gray-700">
              I am 18 or older, or I have verifiable parental/guardian consent.
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!agreedToTerms || !agreedToAge || isPending}
            className="mt-2 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Recording Consent..." : "I Agree & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
