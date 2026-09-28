// Skeleton segera ketika navigasi ke /dashboard — dipapar serta-merta
// sementara server render (Q4). Rangka meniru susun atur sebenar: tajuk,
// 4 kad KPI, baris kedua 4 metrik, dan grid carta.
export default function DashboardLoading() {
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6 max-w-[1600px]">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-8 w-64 rounded-lg bg-slate-200/70 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-32 rounded-xl bg-slate-200/70 animate-pulse" />
          <div className="h-9 w-36 rounded-xl bg-slate-200/70 animate-pulse" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-slate-200/70 animate-pulse" />
              <div className="w-9 h-9 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
            <div className="h-8 w-40 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-5 w-56 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-44 rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-32 rounded-full bg-slate-100 animate-pulse mx-auto w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
