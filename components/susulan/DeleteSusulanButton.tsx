'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { padamSusulan } from '@/lib/actions/susulan'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

interface DeleteSusulanButtonProps {
  susulanId: string
  fasilitiId: string
  tarikh: string
}

export function DeleteSusulanButton({ susulanId, fasilitiId, tarikh }: DeleteSusulanButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      try {
        await padamSusulan(susulanId, fasilitiId)
        toast.success('Susulan dipadam', `Rekod susulan ${tarikh} telah dibuang.`)
        setOpen(false)
        router.refresh()
      } catch (err) {
        setOpen(false)
        toast.error('Gagal memadam susulan', err instanceof Error ? err.message : 'Sila cuba lagi.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Delete follow-up"
        className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] transition-colors"
      >
        <Trash2 size={13} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<AlertTriangle size={18} />}
        iconTone="danger"
        title="Delete Follow-up?"
        description="This will permanently remove the follow-up record and cannot be undone."
        maxWidth="max-w-sm"
        ariaLabel="Delete follow-up"
        footer={
          <>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPending ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Follow-up record dated{' '}
          <span className="font-medium text-[var(--color-text-primary)]">{tarikh}</span> and all
          attachments will be permanently deleted.
        </div>
      </Modal>
    </>
  )
}