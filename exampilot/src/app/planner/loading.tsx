import { PlanCardSkeleton } from "@/components/SkeletonCard";

/**
 * Next.js route-level loading UI for /planner.
 *
 * Rendered instantly (before the async Server Component resolves)
 * so the user sees plausible content rather than a blank screen.
 */
export default function PlannerLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-6 pb-24">

      {/* Header row skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 rounded-lg bg-indigo-100 animate-pulse" />
          <div className="h-6 w-36 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="h-8 w-16 rounded-xl bg-gray-200 animate-pulse" />
      </div>

      {/* Three plan card skeletons */}
      <div className="flex flex-col gap-3">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
    </div>
  );
}
