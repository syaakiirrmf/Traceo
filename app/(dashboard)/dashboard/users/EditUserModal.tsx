'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { kemaskiniUser } from '@/lib/actions/users'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import type { User } from '@/types'

const PERANAN_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'pegawai_susulan', label: 'Follow-up Officer' },
  { value: 'pengurus', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
]

export function EditUserModal({
  user,
  canAssignSuperadmin,
}: {
  user: User
  canAssignSuperadmin: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      await kemaskiniUser(user.id, formData)
      const nama = (formData.get('nama') as string) || user.nama
      toast.success('User updated', `${nama}'s profile has been updated.`)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error('Failed to update user', err instanceof Error ? err.message : 'Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit user"
        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand)]"
      >
        <Pencil size={14} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit User"
        description={`Update details for ${user.nama}.`}
        maxWidth="max-w-md"
        ariaLabel="Edit user"
        footer={
          <>
            <button
              type="submit"
              form="edit-user-form"
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
          </>
        }
      >
        <form id="edit-user-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Full Name <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              name="nama"
              required
              defaultValue={user.nama}
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Email Address <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="email"
              name="emel"
              required
              defaultValue={user.emel}
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Role <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="peranan"
              required
              defaultValue={user.peranan}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            >
              {PERANAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {canAssignSuperadmin && (
                <option value="superadmin">Superadmin</option>
              )}
            </select>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Reset Password (optional)
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
              Leave blank to keep the current password.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">
                  New Password
                </label>
                <input
                  type="password"
                  name="kata_laluan"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                  title="8+ characters with uppercase, lowercase and number"
                  placeholder="Minimum 8 characters"
                  className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="sahkan_kata_laluan"
                  placeholder="Confirm password"
                  className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
