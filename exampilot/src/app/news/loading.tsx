export default function NewsLoading() {
  return (
    <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black tracking-tight">Defense News</h1>
        <p className="text-sm text-slate-700 font-medium mt-1">Live updates and high-yield current affairs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[360px] bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="h-48 w-full bg-gray-200" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="h-6 w-full bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="mt-auto h-4 w-1/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
