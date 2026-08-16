'use client'

import { Download } from 'lucide-react'

export function ExportButton({
  href,
  label = 'Export Excel',
  className = '',
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors whitespace-nowrap ${className}`}
    >
      <Download size={14} />{label}
    </a>
  )
}