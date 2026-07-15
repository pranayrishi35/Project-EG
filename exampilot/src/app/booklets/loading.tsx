export default function BookletsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Study Booklets</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Access curated defense exam materials for offline reading.</p>
      </div>
      <div className="h-[180px] md:h-[220px] rounded-3xl bg-slate-900 animate-pulse border border-slate-800 mb-6" />
      
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-bold text-gray-900">Standard Mock Booklets</h2>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-6">
          <div className="h-10 w-48 bg-gray-200 rounded border-b border-slate-700 pb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[160px] bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-indigo-100 rounded" />
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-8 w-8 rounded-full bg-indigo-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
