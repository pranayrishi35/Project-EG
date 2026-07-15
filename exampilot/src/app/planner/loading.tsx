import PlanCardSkeleton from "@/components/SkeletonCard";

export default function PlannerLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-0.5">
            My Plans
          </p>
          <h1 className="text-xl font-bold text-gray-900">Study Planner</h1>
        </div>
        <div
          className="flex items-center gap-2 rounded-2xl px-5 py-3 min-h-[48px] shadow-md opacity-50"
          style={{ 
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white/20 animate-pulse" />
          <div className="h-4 w-24 bg-white/20 rounded animate-pulse hidden sm:block" />
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
    </div>
  );
}
