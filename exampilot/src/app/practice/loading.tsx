export default function PracticeLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Practice Hub</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Sharpen your skills with targeted drills.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 mb-2" />
            <div>
              <div className="h-5 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Test Archive</h2>
        <div className="flex flex-col gap-4">
          <div className="h-[88px] bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-[88px] bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}
