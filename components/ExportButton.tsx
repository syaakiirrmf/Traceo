'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export function ExportButton({
  href,
  label = 'Export Excel',
  className = '',
}: {
  href: string
  label?: string
  className?: string
}) {
  // Elak eksport berganda: eksport XLSX/PDF berat di server.
  const [pending, setPending] = useState(false)

  return (
    <a
      href={pending ? undefined : href}
      aria-disabled={pending}
      onClick={() => {
        if (pending) return
        setPending(true)
        // Reset selepas 8s (muat turun tidak beri callback siap).
        setTimeout(() => setPending(false), 8000)
      }}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors whitespace-nowrap min-h-[44px] ${pending ? 'opacity-60 pointer-events-none' : ''} ${className}`}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {pending ? 'Menjana...' : label}
    </a>
  )
}
