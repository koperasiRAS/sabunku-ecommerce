export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-10">
        <div className="w-48 h-10 bg-slate-200 rounded-xl animate-pulse mx-auto mb-3"></div>
        <div className="w-72 h-5 bg-slate-100 rounded-lg animate-pulse mx-auto"></div>
      </div>
      <div className="mb-8 space-y-4">
        <div className="w-full max-w-md mx-auto h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 h-9 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="aspect-square bg-slate-100 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded animate-pulse w-full"></div>
              <div className="flex justify-between items-end">
                <div className="h-5 bg-slate-200 rounded animate-pulse w-24"></div>
                <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
