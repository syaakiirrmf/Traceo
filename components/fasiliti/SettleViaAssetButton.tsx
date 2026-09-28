'use client'

import { useState } from 'react'
import { Landmark } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { settleViaAsset } from '@/lib/actions/fasiliti'

interface SettleViaAssetButtonProps {
  fasilitiId: string
  kodRujukan: string
  defaultPenama?: string | null
  defaultPindahmilik?: string | null
}

/**
 * Satu-klik settle: kes selesai bila cagaran dah jadi aset (pindah milik
 * kepada penama / dijual). Tetapkan status selesai + cara melalui_aset dan
 * kosongkan tunggakan (settle = cleared) supaya dashboard berhenti kira.
 */
export function SettleViaAssetButton({
  fasilitiId,
  kodRujukan,
  defaultPenama,
  defaultPindahmilik,
}: SettleViaAssetButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      await settleViaAsset(fasilitiId, formData)
      // Berjaya: settleViaAsset redirect — jangan sentuh state, biar navigasi jalan.
    } catch (err) {
      // redirect() throw NEXT_REDIRECT — itu KEJAYAAN, bukan ralat. Lempar semula
      // supaya Next.js navigasi; hanya ralat sebenar dipapar sebagai toast.
      const digest = (err as { digest?: unknown })?.digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err
      setLoading(false)
      toast.error(
        'Failed to settle via asset',
        err instanceof Error ? err.message : 'Please try again.'
      )
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-emerald-500/40 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
      >
        <Landmark size={14} />
        Settle via Asset
      </button>

      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        icon={<Landmark size={18} />}
        iconTone="brand"
        title="Settle via Asset?"
        description={`Facility ${kodRujukan} will be marked Completed (settled via asset) and its arrears cleared to RM 0. Component amounts are kept for audit.`}
        maxWidth="max-w-md"
        ariaLabel="Settle facility via asset"
        footer={
          <button
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        }
      >
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Asset Nominee <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              name="penama_aset"
              required
              maxLength={200}
              defaultValue={defaultPenama ?? ''}
              placeholder="e.g. MOHD AZRUL BIN ZAKARIA"
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Transfer / Sale Note
            </label>
            <input
              type="text"
              name="status_pindahmilik"
              maxLength={200}
              defaultValue={defaultPindahmilik ?? ''}
              placeholder="e.g. Geran diserah 12/03/2026 — dijual RM 450,000"
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[var(--radius-md)] bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Settling...' : 'Confirm — settle via asset'}
          </button>
        </form>
      </Modal>
    </>
  )
}
