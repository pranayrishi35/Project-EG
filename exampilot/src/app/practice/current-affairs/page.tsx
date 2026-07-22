"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAffairsTest } from "@/app/actions/getCurrentAffairsTest";
import { gradeCurrentAffairs } from "@/app/actions/gradeCurrentAffairs";
import type { Question, ScoringMap } from "@/app/actions/getMockTest";
import dynamic from "next/dynamic";

const TestRunner = dynamic(() => import("@/components/TestRunner"), { ssr: false });

export default function CurrentAffairsPracticePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [scoringMap, setScoringMap] = useState<ScoringMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTest() {
      const result = await getCurrentAffairsTest();
      if (result.success) {
        setQuestions(result.questions);
        setScoringMap(result.scoringMap);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    loadTest();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-indigo-200/20 animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-slate-700">Loading Current Affairs Quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !questions || !scoringMap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-2xl text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Test Unavailable</h2>
          <p className="text-slate-700 mb-8">{error || "Failed to load test."}</p>
          <button 
            onClick={() => router.push("/practice")}
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
          >
            Back to Practice Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <TestRunner
      type="Mini-Test" // Acts like a Mini-Test UI-wise
      questions={questions}
      scoringMap={scoringMap}
      onGrade={gradeCurrentAffairs}
      onExit={() => router.push("/practice")}
    />
  );
}
