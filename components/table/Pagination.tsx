'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = '',
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  pageSize: number
  className?: string
}) {
  if (totalPages <= 1) return null

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  const btn =
    'w-7 h-7 rounded-md inline-flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] ${className}`}
    >
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Showing <span className="font-medium text-[var(--color-text-primary)]">{start}</span>–
        <span className="font-medium text-[var(--color-text-primary)]">{end}</span> of{' '}
        <span className="font-medium text-[var(--color-text-primary)]">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="First page"
          className={btn}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          className={btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, idx) => {
          const prev = pages[idx - 1]
          const gap = prev !== undefined && p - prev > 1
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && <span className="px-1 text-xs text-[var(--color-text-tertiary)]">…</span>}
              <button
                type="button"
                aria-current={p === page ? 'page' : undefined}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${p === page ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          type="button"
          aria-label="Next page"
          className={btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          aria-label="Last page"
          className={btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
