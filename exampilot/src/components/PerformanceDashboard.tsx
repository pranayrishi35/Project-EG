"use client";

import { useState, useEffect } from "react";
import { fetchAggregateStats } from "@/app/actions/mockAttempts";

export default function PerformanceDashboard() {
  const [filter, setFilter] = useState("ALL");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const res = await fetchAggregateStats(filter === "ALL" ? undefined : filter);
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setStats(null);
      }
      setLoading(false);
    }
    loadStats();
  }, [filter]);

  if (loading) {
    return <div className="h-64 rounded-3xl bg-slate-100 animate-pulse mb-8" />;
  }

  // If no tests overall and no filter applied, don't show the dashboard
  if (!stats && filter === "ALL") {
    return null;
  }

  const getColorClass = (accuracy: number) => {
    if (accuracy < 40) return "bg-rose-500 hover:bg-rose-400";
    if (accuracy < 70) return "bg-amber-500 hover:bg-amber-400";
    return "bg-emerald-500 hover:bg-emerald-400";
  };
  
  const getTextColor = (accuracy: number) => {
    if (accuracy < 40) return "text-rose-500";
    if (accuracy < 70) return "text-amber-500";
    return "text-emerald-500";
  };

  const tabs = ["ALL", "AFCAT", "NDA_MATH", "NDA_GAT", "CDS"];

  return (
    <div className="mb-8 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white relative print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
          <span>📈</span> Performance Analytics
        </h2>
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Total Tests</span>
          <span className="text-2xl font-black text-white">{stats?.totalAttempts || 0}</span>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Avg Accuracy</span>
          <span className={`text-2xl font-black ${stats ? getTextColor(stats.avgAccuracy) : 'text-slate-500'}`}>{stats?.avgAccuracy || 0}%</span>
        </div>
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Best Score</span>
          <span className="text-2xl font-black text-indigo-400">{stats?.bestScore || 0}</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Accuracy Trend {stats?.trendData?.length ? `(Last ${stats.trendData.length})` : ''}</h3>
        <div className="h-40 flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-800 pb-2 relative">
          {stats?.trendData?.length > 0 ? stats.trendData.map((attempt: any) => (
            <div key={attempt.id} className="relative group flex-1 flex flex-col items-center justify-end h-full">
              <div 
                className={`w-full max-w-[2rem] rounded-t-sm transition-all duration-500 ease-out ${getColorClass(attempt.accuracy)}`}
                style={{ height: `${Math.max(attempt.accuracy, 5)}%` }}
              />
              
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                <p className="font-bold">{attempt.accuracy}% <span className="text-slate-400 font-normal ml-1">({attempt.score} marks)</span></p>
                <p className="text-[10px] text-slate-400">{attempt.date} • {attempt.exam_target}</p>
              </div>
            </div>
          )) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium">
              No completed tests for this filter.
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          <span>Oldest</span>
          <span>Newest</span>
        </div>
      </div>
    </div>
  );
}
