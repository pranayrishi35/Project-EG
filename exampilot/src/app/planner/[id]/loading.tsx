import { PlanViewerSkeleton } from "@/components/SkeletonCard";

/**
 * Next.js route-level loading UI for /planner/[id].
 *
 * Rendered instantly while the async Server Component fetches
 * the plan row from Supabase. Mirrors the exact layout of the
 * real PlanViewer (hero + stats + day cards) so there's no layout shift.
 */
export default function PlanViewerLoading() {
  return <PlanViewerSkeleton />;
}
