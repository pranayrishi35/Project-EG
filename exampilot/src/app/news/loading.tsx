export default function NewsLoading() {
  return (
    <div className="p-4 md:p-6 pb-24 max-w-3xl mx-auto flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-slate-800 rounded-lg w-48 mb-2"></div>
        <div className="h-4 bg-slate-800 rounded w-72"></div>
      </div>

      {/* 1-Column Skeleton Feed */}
      <div className="w-full flex flex-col md:flex-row rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[280px] bg-slate-800 flex-shrink-0" />
        <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
          <div className="h-5 bg-indigo-500/20 rounded w-24 mb-4" />
          <div className="h-6 bg-slate-800 rounded w-3/4 mb-3" />
          <div className="h-6 bg-slate-800 rounded w-1/2 mb-6" />
          <div className="h-4 bg-slate-800 rounded w-full mb-2" />
          <div className="h-4 bg-slate-800 rounded w-5/6 mb-6" />
          
          <div className="mt-auto flex items-center justify-between">
            <div className="h-4 bg-slate-800 rounded w-24" />
            <div className="h-10 bg-slate-800 rounded-xl w-36" />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[280px] bg-slate-800 flex-shrink-0" />
        <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
          <div className="h-5 bg-indigo-500/20 rounded w-24 mb-4" />
          <div className="h-6 bg-slate-800 rounded w-3/4 mb-3" />
          <div className="h-6 bg-slate-800 rounded w-1/2 mb-6" />
          <div className="h-4 bg-slate-800 rounded w-full mb-2" />
          <div className="h-4 bg-slate-800 rounded w-5/6 mb-6" />
          
          <div className="mt-auto flex items-center justify-between">
            <div className="h-4 bg-slate-800 rounded w-24" />
            <div className="h-10 bg-slate-800 rounded-xl w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
