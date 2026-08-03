export default function FasilitiLoading() {
  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-24 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-4 w-40 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-72 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-9 w-36 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-9 w-36 rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* Header row */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 flex gap-8">
          {[60, 160, 100, 120, 100, 80].map((w, i) => (
            <div key={i} className="h-3.5 rounded bg-[var(--color-border)] animate-pulse" style={{ width: w }} />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b border-[var(--color-border)] last:border-0 flex gap-8 items-center">
            <div className="h-5 w-14 rounded bg-[var(--color-brand-subtle)] animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 rounded bg-[var(--color-surface-raised)] animate-pulse" />
              <div className="h-3 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
            </div>
            <div className="h-4 w-20 rounded bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-4 w-28 rounded bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-[var(--color-surface-raised)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
