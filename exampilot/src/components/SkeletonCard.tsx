/**
 * SkeletonCard — reusable shimmer placeholder component.
 *
 * Exports two variants:
 *   <PlanCardSkeleton />     — mimics a planner history card
 *   <TopicRowSkeleton />     — mimics a topic checklist row inside a day card
 *   <PlanViewerSkeleton />   — mimics the full /planner/[id] hero + day cards
 */

// ─── Shared primitive ─────────────────────────────────────────────────────────

function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Plan history card skeleton ───────────────────────────────────────────────

export function PlanCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
      aria-busy="true"
      aria-label="Loading plan"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 flex flex-col gap-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
        {/* Days-left badge */}
        <Bone className="h-6 w-16 rounded-xl flex-shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Bone className="h-3 w-32" />
          <Bone className="h-3 w-8" />
        </div>
        <Bone className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// ─── Topic row skeleton (inside day card) ─────────────────────────────────────

export function TopicRowSkeleton() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      {/* Checkbox */}
      <div className="w-5 h-5 rounded-md bg-gray-200 animate-pulse flex-shrink-0" />
      {/* Text */}
      <div className="flex-1 h-3.5 rounded-lg bg-gray-200 animate-pulse" />
    </div>
  );
}

// ─── Day card skeleton ────────────────────────────────────────────────────────

function DayCardSkeleton({ topicCount = 3 }: { topicCount?: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-3 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-12" />
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-3 w-8" />
        </div>
      </div>
      {/* Topics */}
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: topicCount }).map((_, i) => (
          <TopicRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Full plan viewer skeleton ────────────────────────────────────────────────

export function PlanViewerSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4 pt-6 pb-24" aria-busy="true" aria-label="Loading study plan">
      {/* Hero skeleton */}
      <div className="rounded-2xl p-6 bg-indigo-100 animate-pulse flex flex-col gap-3">
        <div className="h-3 w-24 bg-indigo-200 rounded-lg" />
        <div className="h-7 w-48 bg-indigo-200 rounded-lg" />
        <div className="h-4 w-36 bg-indigo-200 rounded-lg" />
        {/* Progress bar */}
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-28 bg-indigo-200 rounded-lg" />
            <div className="h-3 w-8 bg-indigo-200 rounded-lg" />
          </div>
          <div className="h-2 w-full bg-indigo-200 rounded-full" />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-2 shadow-sm">
            <Bone className="w-8 h-8 rounded-xl" />
            <Bone className="h-4 w-10" />
            <Bone className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Week 1 header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-200 animate-pulse" />
        <Bone className="h-3.5 w-20" />
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Day cards */}
      {[3, 2, 4, 3].map((count, i) => (
        <DayCardSkeleton key={i} topicCount={count} />
      ))}
    </div>
  );
}

// ─── Default export — plan card skeleton (for simple usage) ──────────────────

export default PlanCardSkeleton;
