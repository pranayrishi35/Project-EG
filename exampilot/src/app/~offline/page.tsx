"use client";

import Link from 'next/link';

export default function OfflineFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <span className="text-4xl" aria-hidden="true">📡</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">You are offline</h1>
      <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed font-medium">
        It looks like you've lost your internet connection. 
        Don't worry, your active exams are securely cached on your device.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => window.location.reload()} 
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
        >
          Try Again
        </button>
        <Link href="/" className="px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          Go Home
        </Link>
      </div>
    </div>
  );
}
