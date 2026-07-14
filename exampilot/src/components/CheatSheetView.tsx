"use client";

import { useState, useEffect } from "react";
import { generateCheatSheet, type CheatSheetSection } from "@/app/actions/generateCheatSheet";

export default function CheatSheetView({ planId, onClose }: { planId: string; onClose: () => void }) {
  const [cheatSheet, setCheatSheet] = useState<CheatSheetSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotes() {
      const result = await generateCheatSheet(planId);
      if (result.success) {
        setCheatSheet(result.cheatSheet);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    fetchNotes();
  }, [planId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6 animate-fade-in print:hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-800">Generating Cheat Sheet...</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        <div className="columns-1 md:columns-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 break-inside-avoid animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 rounded w-full" />
                <div className="h-2 bg-slate-200 rounded w-5/6" />
                <div className="h-2 bg-slate-200 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in print:hidden">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-lg font-bold text-red-600 mb-2">{error}</h2>
        <button onClick={onClose} className="ep-btn-primary mt-4">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-fade-in print:static print:bg-white print:overflow-visible">
      <div className="max-w-4xl mx-auto p-4 py-8 min-h-screen">
        
        {/* Header Controls */}
        <div className="print:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-2xl">🧠</span> AI Cheat Sheet
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">High-yield revision notes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              🖨️ Print Notes
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-black">AI Cheat Sheet</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">ExamPilot Revision Notes</p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 md:columns-2 gap-6 print:columns-2 print:gap-8">
          {cheatSheet.map((section, idx) => (
            <div key={idx} className="mb-6 break-inside-avoid bg-white border border-slate-200 rounded-2xl p-5 shadow-sm print:border-black print:rounded-none print:shadow-none print:p-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 print:text-black print:border-b print:border-black print:pb-1">
                {section.subject}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2 text-sm text-slate-700 print:text-black">
                    <span className="text-indigo-400 mt-0.5 font-bold print:text-black">•</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
