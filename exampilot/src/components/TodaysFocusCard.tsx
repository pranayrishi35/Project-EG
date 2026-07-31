"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Target, Clock, Check, ArrowRight, PartyPopper } from "lucide-react";
import { toggleTopic } from "@/app/actions/toggleTopic";
import type { TodaysFocusData } from "@/app/actions/getTodaysFocus";

/**
 * Today's Focus — the single highest-leverage daily-habit surface.
 * Renders the current day's topics from the user's active plan and lets the
 * candidate check them off in place (optimistic + toggleTopic persistence,
 * same JSONB completed_topics store the planner uses).
 */
export default function TodaysFocusCard({ data }: { data: TodaysFocusData }) {
  const [done, setDone] = useState<Set<string>>(
    () => new Set(data.topics.filter((t) => t.done).map((t) => t.key))
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const total = data.topics.length;
  const completedCount = data.topics.filter((t) => done.has(t.key)).length;
  const allDone = total > 0 && completedCount === total;

  const handleToggle = (key: string) => {
    // Optimistic flip
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPendingKey(key);
    startTransition(async () => {
      try {
        const saved = await toggleTopic(data.planId, key);
        setDone(new Set(saved));
      } catch {
        // Revert on failure
        setDone((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      } finally {
        setPendingKey(null);
      }
    });
  };

  const tag = data.isMock ? "Mock Exam Day" : data.isRevision ? "Revision Day" : null;

  return (
    <section
      aria-labelledby="todays-focus-heading"
      className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6 md:p-8 relative overflow-hidden animate-fade-in"
    >
      {/* Ambient accent */}
      <div className="absolute -right-8 -top-8 opacity-[0.06] pointer-events-none" aria-hidden="true">
        <Target size={140} strokeWidth={1} className="text-brand-accent-500" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-brand-accent-600">
              Today&apos;s Focus
            </span>
            {tag && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            )}
          </div>
          <h2 id="todays-focus-heading" className="text-xl font-black text-gray-900 tracking-tight">
            {data.planComplete ? "Final revision push" : `Day ${data.dayNumber} of ${data.totalDays}`}
            <span className="text-slate-500 font-bold"> · {data.examName}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Clock size={13} strokeWidth={2} aria-hidden="true" />
            {data.estimatedHours}h planned
          </span>
          <span className="text-sm font-black text-brand-accent-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
            {completedCount}/{total}
          </span>
        </div>
      </div>

      {data.planComplete && (
        <div className="mb-5 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 relative z-10">
          <PartyPopper size={15} strokeWidth={2} aria-hidden="true" className="flex-shrink-0" />
          You&apos;ve reached the end of this plan&apos;s schedule — keep revising the final day&apos;s topics.
        </div>
      )}

      {/* Topic checklist */}
      {allDone ? (
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-8 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
          <span className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
            <Check size={26} strokeWidth={3} className="text-white" aria-hidden="true" />
          </span>
          <p className="text-base font-black text-emerald-900">Today&apos;s targets are cleared</p>
          <p className="text-sm text-emerald-700 mt-1">Great discipline. See you tomorrow, pilot.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 relative z-10" role="list">
          {data.topics.map((topic) => {
            const isChecked = done.has(topic.key);
            const isPending = pendingKey === topic.key;
            return (
              <li key={topic.key}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`Mark "${topic.label}" as ${isChecked ? "not covered" : "covered"} today`}
                  disabled={isPending}
                  onClick={() => handleToggle(topic.key)}
                  className={[
                    "w-full flex items-start gap-3 text-left px-4 py-3 rounded-2xl border transition-all active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isChecked
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-white border-gray-100 hover:border-brand-accent-300 hover:bg-amber-50/30",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      isChecked
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-white border-gray-300",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {isChecked && <Check size={12} strokeWidth={3.5} className="text-white" />}
                  </span>
                  <span
                    className={[
                      "text-sm font-medium leading-snug",
                      isChecked ? "text-emerald-800 line-through decoration-emerald-400" : "text-gray-800",
                    ].join(" ")}
                  >
                    {topic.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer link into the full plan */}
      <div className="mt-6 pt-4 border-t border-gray-100 relative z-10">
        <Link
          href={`/planner/${data.planId}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-accent-600 hover:text-brand-accent-700 transition-colors"
        >
          Open full study plan
          <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
