'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { padamBayaran } from '@/lib/actions/bayaran'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

interface DeleteBayaranButtonProps {
  bayaranId: string
  fasilitiId: string
  label: string
}

export function DeleteBayaranButton({ bayaranId, fasilitiId, label }: DeleteBayaranButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      try {
        await padamBayaran(bayaranId, fasilitiId)
        toast.success('Bayaran dipadam', 'Rekod bayaran telah dibuang.')
        setOpen(false)
        router.refresh()
      } catch (err) {
        setOpen(false)
        toast.error(
          'Gagal memadam bayaran',
          err instanceof Error ? err.message : 'Sila cuba lagi.'
        )
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Padam bayaran"
        aria-label="Padam bayaran"
        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-9 sm:h-9 rounded-[var(--radius-sm)] inline-flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] transition-colors"
      >
        <Trash2 size={13} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<AlertTriangle size={18} />}
        iconTone="danger"
        title="Padam Bayaran?"
        description="Rekod bayaran akan dibuang dan baki akan dikira semula. Tindakan ini tidak boleh diundur."
        maxWidth="max-w-sm"
        ariaLabel="Padam bayaran"
        footer={
          <>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPending ? 'Memadam...' : 'Ya, padam'}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Batal
            </button>
          </>
        }
      >
        <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Bayaran <span className="font-medium text-[var(--color-text-primary)]">{label}</span> akan
          dipadam kekal.
        </div>
      </Modal>
    </>
  )
}
