import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import { fetchMockHistory } from "@/app/actions/mockAttempts";
import dynamic from 'next/dynamic';

const PerformanceDashboard = dynamic(() => import("@/components/PerformanceDashboard"), {
  ssr: false,
  loading: () => <div className="w-full h-[320px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl mb-6" />
});
export const metadata = {
  title: "Practice Hub | ExamPilot",
  description: "Mock Tests, Mini-Tests, and Daily Flashcards",
};

async function PracticeContent() {
  const supabase = createClient();
  
  // Fetch recent plans to dynamically route the Mock Test button
  const { data: recentPlans } = await supabase
    .from("study_plans")
    .select("id, exam_name")
    .order("created_at", { ascending: false })
    .limit(1);

  const activePlanId = recentPlans && recentPlans.length > 0 ? recentPlans[0].id : null;

  // Fetch History
  const historyResponse = await fetchMockHistory();
  const history = historyResponse.success ? historyResponse.data : [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Link
          href={activePlanId ? `/planner/${activePlanId}?tab=mocks` : "/planner"}
          className="group flex flex-col gap-3 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
            🎯
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Mock Tests</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Full-length exams & analytics</p>
          </div>
        </Link>

        <Link
          href={activePlanId ? `/planner/${activePlanId}?tab=mocks` : "/planner"}
          className="group flex flex-col gap-3 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
            ⏱️
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Mini-Tests</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Quick 15-minute topic drills</p>
          </div>
        </Link>

        <Link
          href="/flashcards"
          className="group flex flex-col gap-3 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Daily Flashcards</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Spaced repetition reviews</p>
          </div>
        </Link>

        <Link
          href="/practice/current-affairs"
          className="group flex flex-col gap-3 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
            📰
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Daily Current Affairs Quiz</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">15-minute global & defense updates</p>
          </div>
        </Link>
      </div>

      <PerformanceDashboard />

      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Test Archive</h2>
        {history && history.length > 0 ? (
          <div className="flex flex-col gap-4">
            {history.map((attempt: any) => (
              <div key={attempt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {attempt.exam_target} Mock Test {attempt.test_number}
                    {attempt.status === 'in_progress' ? (
                      <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">In Progress</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Completed</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">
                    {new Date(attempt.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {attempt.status === 'in_progress' ? (
                  <Link 
                    href={`/practice/mock/${attempt.id}`}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 text-center text-sm flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Resume Mock Test {attempt.test_number}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Score</p>
                      <p className="font-black text-indigo-600">{attempt.score}</p>
                    </div>
                    <Link 
                      href={`/practice/mock/${attempt.id}`}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95 text-center text-sm flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Review Mode
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 p-10 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100/50 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/40 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" aria-hidden="true" />
            
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-white shadow-md border border-indigo-50 flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            
            <div className="relative z-10 text-center flex flex-col gap-1.5 max-w-sm">
              <h3 className="text-lg font-black text-gray-900">No test data available</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Take your first Mock Test to unlock your AI Tactical Debrief.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[160px] bg-white rounded-3xl border border-gray-100 shadow-sm p-5" />
      ))}
    </div>
  );
}

export default function PracticeHub() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Practice Hub</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Sharpen your skills with targeted drills.</p>
      </div>
      
      <Suspense fallback={<SkeletonLayout />}>
        <PracticeContent />
      </Suspense>
    </div>
  );
}
