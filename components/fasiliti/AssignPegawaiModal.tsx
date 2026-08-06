'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Check, Users } from 'lucide-react'
import { kemaskiniPegawaiFasiliti } from '@/lib/actions/fasiliti'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

interface Officer {
  id: string
  nama: string
  emel: string
  peranan: string
}

interface AssignPegawaiModalProps {
  fasilitiId: string
  assignedPegawaiIds: string[]
  allOfficers: Officer[]
}

export function AssignPegawaiModal({
  fasilitiId,
  assignedPegawaiIds,
  allOfficers,
}: AssignPegawaiModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedPegawaiIds)
  const [loading, setLoading] = useState(false)

  function toggleOfficer(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      await kemaskiniPegawaiFasiliti(fasilitiId, selectedIds)
      toast.success('Officer assignments updated', `${selectedIds.length} officer(s) assigned to this facility.`)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update assignment', err instanceof Error ? err.message : 'Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setSelectedIds(assignedPegawaiIds)
          setOpen(true)
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        <UserPlus size={14} />
        Assign Officers ({assignedPegawaiIds.length})
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<Users size={18} />}
        title="Officer Assignment"
        description="Select follow-up officers assigned to handle this facility."
        maxWidth="max-w-md"
        ariaLabel="Assign officers"
        footer={
          <>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Assignments'}
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
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {allOfficers.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] py-4 text-center">
              No registered follow-up officers or managers found
            </p>
          ) : (
            allOfficers.map((off) => {
              const isSelected = selectedIds.includes(off.id)
              return (
                <div
                  key={off.id}
                  onClick={() => toggleOfficer(off.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleOfficer(off.id)
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {off.nama}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{off.emel}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Modal>
    </>
  )
}