export default function MockTestLoading() {
  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden font-sans w-full">
      {/* ── Main Engine Area ── */}
      <div className="flex-1 flex flex-col h-full relative z-10 transition-all duration-300 mr-80">
        
        {/* Header Bar */}
        <div className="bg-white border-b border-slate-200 h-[72px] flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-32 h-6 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          
          <div className="hidden md:flex gap-4">
            <div className="w-24 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div className="w-32 h-6 bg-slate-200 rounded-lg animate-pulse" />
          </div>

          <div className="space-y-4 mb-10">
            <div className="w-3/4 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-5/6 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-1/2 h-8 bg-slate-200 rounded-lg animate-pulse" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full h-16 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            <div className="w-full h-16 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            <div className="w-full h-16 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            <div className="w-full h-16 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white border-t border-slate-200 p-4 md:px-8 absolute bottom-0 w-full flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="flex gap-3">
            <div className="w-24 h-12 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-36 h-12 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="w-32 h-12 bg-indigo-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* ── Desktop Right Sidebar ── */}
      <div className="hidden md:flex flex-col w-80 bg-white border-l border-slate-200 fixed right-0 top-0 h-[100dvh] shadow-2xl z-20">
        <div className="h-[72px] flex items-center justify-center border-b border-slate-200 shrink-0">
          <div className="w-40 h-8 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Legend Skeleton */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-8">
             <div className="w-full h-6 bg-slate-200 rounded animate-pulse" />
             <div className="w-full h-6 bg-slate-200 rounded animate-pulse" />
             <div className="w-full h-6 bg-slate-200 rounded animate-pulse" />
             <div className="w-full h-6 bg-slate-200 rounded animate-pulse" />
          </div>
          
          {/* Palette Grid Skeleton */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="w-full h-14 bg-emerald-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
