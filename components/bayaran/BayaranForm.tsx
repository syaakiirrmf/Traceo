'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { tambahBayaran } from '@/lib/actions/bayaran'
import { toast } from '@/components/ui/toast'
import type { BayaranJenis } from '@/types'

const JENIS_OPTIONS: { value: BayaranJenis; label: string }[] = [
  { value: 'dividen', label: 'Dividen / Profit sharing' },
  { value: 'modal', label: 'Modal (capital)' },
  { value: 'caj_lewat', label: 'Caj lewat' },
  { value: 'lain', label: 'Lain-lain' },
]

export function BayaranForm({ fasilitiId }: { fasilitiId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await tambahBayaran(fasilitiId, formData)
        toast.success('Bayaran direkod', 'Rekod bayaran baharu telah disimpan.')
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(
          'Gagal merekod bayaran',
          err instanceof Error ? err.message : 'Sila cuba lagi.'
        )
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
      >
        <Plus size={14} />
        Rekod bayaran
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/50 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Tarikh bayar
          </span>
          <input
            type="date"
            name="tarikh_bayar"
            required
            defaultValue={today}
            max={today}
            className="h-11 sm:h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Jumlah (RM)
          </span>
          <input
            type="number"
            name="jumlah"
            required
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="cth: 5000"
            className="h-11 sm:h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Jenis bayaran
          </span>
          <select
            name="jenis"
            defaultValue="dividen"
            className="h-11 sm:h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          >
            {JENIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          Remark <span className="text-[var(--color-text-tertiary)]">(pilihan)</span>
        </span>
        <input
          type="text"
          name="catatan"
          maxLength={1000}
          placeholder="cth: Bayaran ansuran bulan 3 — resit #123"
          className="h-11 sm:h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-[44px] px-4 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-60"
        >
          {isPending ? 'Menyimpan...' : 'Simpan bayaran'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="min-h-[44px] px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
