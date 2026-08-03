// Anti-slop summary helpers (Strict color discipline, WCAG compliant)

export function dash(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '' || val === 0) return '—'
  return String(val)
}

export function formatRM(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—'
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(val)
}

export function formatArea(val: number | null | undefined): string {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 4 }).format(val) + ' m²'
}

export function calculateLTV(jumlahPembiayaan: number | null | undefined, nilaiCagaran: number | null | undefined): string | null {
  if (!jumlahPembiayaan || !nilaiCagaran || nilaiCagaran <= 0) return null
  const ltv = (jumlahPembiayaan / nilaiCagaran) * 100
  return ltv.toFixed(1) + '%'
}

// Minimalist status config — no loud solid pills, disciplined colors
export const STATUS_CONFIG = {
  aktif: { label: 'Lancar', bg: 'bg-[var(--color-surface-raised)]', text: 'text-[var(--color-text-secondary)]', border: 'border-[var(--color-border)]' },
  tertunggak: { label: 'Tertunggak', bg: 'bg-[var(--color-danger-subtle)]', text: 'text-[var(--color-danger)]', border: 'border-[var(--color-danger)]/30' },
  tindakan_guaman: { label: 'Tindakan Guaman', bg: 'bg-[var(--color-danger-subtle)]', text: 'text-[var(--color-danger)]', border: 'border-[var(--color-danger)]/30' },
  selesai: { label: 'Selesai', bg: 'bg-[var(--color-surface-raised)]', text: 'text-[var(--color-text-tertiary)]', border: 'border-[var(--color-border)]' },
} as const
