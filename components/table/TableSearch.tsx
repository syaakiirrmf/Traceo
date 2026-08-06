'use client'

import { Search, X, ChevronDown } from 'lucide-react'

export function TableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label className={`group flex flex-col gap-1.5 ${className}`}>
      {/* Eyebrow label */}
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:text-[var(--color-brand)]">
        Search
      </span>

      {/* Island field: outer shell + inner core (Double-Bezel) */}
      <div className="relative transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px focus-within:-translate-y-px">
        {/* Outer shell */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[var(--radius-md)] bg-linear-to-b from-[var(--color-border-strong)]/50 via-[var(--color-border)] to-[var(--color-border)] ring-1 ring-inset ring-[var(--color-border)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:ring-2 group-focus-within:ring-[var(--color-brand)] group-focus-within:shadow-[var(--shadow-md)]"
        />
        {/* Inner core */}
        <div className="absolute inset-[1px] rounded-[calc(var(--radius-md)-1px)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[var(--color-surface-raised)]" />

        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:text-[var(--color-brand)]"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="relative w-full h-9 pl-9 pr-8 rounded-[var(--radius-md)] bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none active:scale-[0.985] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </label>
  )
}

export function matchesQuery(value: unknown, query: string): boolean {
  return String(value ?? '')
    .toLowerCase()
    .includes(query)
}

export interface TableSelectOption {
  value: string
  label: string
}

export function TableSelect({
  value,
  onChange,
  options,
  label,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: TableSelectOption[]
  label: string
  className?: string
}) {
  return (
    <label className={`group flex flex-col gap-1.5 ${className}`}>
      {/* Eyebrow label */}
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:text-[var(--color-brand)]">
        {label}
      </span>

      {/* Island field: outer shell + inner core (Double-Bezel) */}
      <div className="relative transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px focus-within:-translate-y-px">
        {/* Outer shell */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[var(--radius-md)] bg-linear-to-b from-[var(--color-border-strong)]/50 via-[var(--color-border)] to-[var(--color-border)] ring-1 ring-inset ring-[var(--color-border)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:ring-2 group-focus-within:ring-[var(--color-brand)] group-focus-within:shadow-[var(--shadow-md)]"
        />
        {/* Inner core */}
        <div className="absolute inset-[1px] rounded-[calc(var(--radius-md)-1px)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[var(--color-surface-raised)]" />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="relative w-full h-9 pl-3 pr-8 rounded-[var(--radius-md)] bg-transparent text-sm text-[var(--color-text-primary)] focus:outline-none active:scale-[0.985] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:text-[var(--color-brand)]"
        />
      </div>
    </label>
  )
}