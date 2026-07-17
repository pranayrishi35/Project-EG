"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden text-center animate-fade-in relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600" aria-hidden="true" />
        
        <div className="p-8 pb-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm border border-rose-100">
            ⚠️
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
            Something went wrong.
          </h2>
          
          <p className="text-slate-500 text-sm leading-relaxed font-medium px-4">
            A temporary system error occurred. Don&apos;t worry, all your active study plans and progress data are perfectly safe in the cloud.
          </p>

          {error.digest && (
            <div className="mt-4 inline-block bg-slate-50 border border-slate-100 text-slate-700 text-[10px] font-mono px-2 py-1 rounded-md">
              Error ID: {error.digest}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl border border-slate-200 transition-all active:scale-[0.98]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
