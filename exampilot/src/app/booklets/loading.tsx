export default function BookletsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6 pb-24 max-w-7xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-80"></div>
      </div>

      {/* Grid skeleton */}
      {[1, 2].map((group) => (
        <div key={group} className="mb-8">
          <div className="h-10 bg-gray-200 rounded-xl w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 bg-gray-100 rounded-3xl border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex justify-end">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
