'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { padamFasiliti } from '@/lib/actions/fasiliti'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

interface DeleteFasilitiButtonProps {
  fasilitiId: string
  kodRujukan: string
}

export function DeleteFasilitiButton({ fasilitiId, kodRujukan }: DeleteFasilitiButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await padamFasiliti(fasilitiId)
    } catch (err) {
      setLoading(false)
      setOpen(false)
      toast.error(
        'Failed to delete facility',
        err instanceof Error ? err.message : 'Please try again.'
      )
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-danger)]/40 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors"
      >
        <Trash2 size={14} />
        Delete
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<AlertTriangle size={18} />}
        iconTone="danger"
        title="Delete Facility?"
        description="This will permanently remove the facility record and cannot be undone."
        maxWidth="max-w-sm"
        ariaLabel="Delete facility"
        footer={
          <>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Deleting...' : 'Delete everything'}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Facility{' '}
          <span className="font-mono font-semibold text-[var(--color-danger)]">{kodRujukan}</span>{' '}
          and all associated follow-ups + attachments will be permanently deleted.
        </div>
        <p className="mt-4 text-xs text-[var(--color-danger)] bg-[var(--color-danger-subtle)] rounded-[var(--radius-sm)] px-3 py-2">
          ⚠️ This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}
