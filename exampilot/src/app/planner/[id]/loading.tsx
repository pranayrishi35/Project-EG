export default function PlanLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      {/* ── Fixed Header Skeleton ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm p-4 safe-top">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse mb-2" />
              <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="w-16 h-16 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="w-1/4 h-full bg-slate-300 animate-pulse rounded-full" />
            </div>
            <div className="w-10 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Main Content Skeleton ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 mt-4 space-y-8">
        
        {/* Week Skeleton */}
        <div className="space-y-4">
          <div className="w-24 h-6 bg-slate-200 rounded-lg animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Card Skeleton */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="w-16 h-5 bg-slate-200 rounded animate-pulse" />
                  <div className="w-12 h-5 bg-indigo-100 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 bg-slate-200 rounded mt-0.5 shrink-0 animate-pulse" />
                    <div className="w-3/4 h-5 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 bg-slate-200 rounded mt-0.5 shrink-0 animate-pulse" />
                    <div className="w-2/3 h-5 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
