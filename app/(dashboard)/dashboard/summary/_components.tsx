'use client'

import React, { useState } from 'react'
import { Info, SlidersHorizontal } from 'lucide-react'
import { STATUS_CONFIG } from './_helpers'

export function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG | string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.aktif
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  )
}

export function FormulaTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex items-center ml-1 cursor-help group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={12} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] text-[11px] font-normal leading-relaxed rounded-md shadow-lg z-50 pointer-events-none whitespace-normal">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-text-primary)]" />
        </span>
      )}
    </span>
  )
}

export function ToggleColumnsButton({
  showExtra,
  onToggle,
}: {
  showExtra: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all"
    >
      <SlidersHorizontal size={13} className="text-[var(--color-text-tertiary)]" />
      <span>{showExtra ? 'Hide extra details' : 'Show extra details (Nominee & Transfer of Title Status)'}</span>
    </button>
  )
}
