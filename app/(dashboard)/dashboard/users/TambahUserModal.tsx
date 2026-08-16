'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { tambahUser } from '@/lib/actions/users'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'

const PERANAN_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'pegawai_susulan', label: 'Follow-up Officer' },
  { value: 'pengurus', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
]

export function TambahUserModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      await tambahUser(formData)
      const nama = (formData.get('nama') as string) || 'New user'
      toast.success('User added', `${nama} can now log in.`)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error('Failed to add user', err instanceof Error ? err.message : 'Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
      >
        <Plus size={15} />
        Add User
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New User"
        description="Create an account for a new system user."
        maxWidth="max-w-md"
        ariaLabel="Add new user"
        footer={
          <>
            <button
              type="submit"
              form="tambah-user-form"
              disabled={loading}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Account'}
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
        <form id="tambah-user-form" action={handleSubmit} className="space-y-4">
          <Field label="Full Name" name="nama" required placeholder="John Doe" />
          <Field
            label="Email Address"
            name="emel"
            type="email"
            required
            placeholder="john@company.com"
          />
          <Field
            label="Password"
            name="kata_laluan"
            type="password"
            required
            placeholder="Minimum 8 characters"
            hint="8+ characters with upper, lower &amp; number"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Role <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              name="peranan"
              required
              defaultValue="viewer"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            >
              {PERANAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-text-primary)]">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        minLength={name === 'kata_laluan' ? 8 : undefined}
        pattern={name === 'kata_laluan' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}' : undefined}
        title={
          name === 'kata_laluan'
            ? '8+ characters with uppercase, lowercase and number'
            : undefined
        }
        placeholder={placeholder}
        className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
      />
      {hint && <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  )
}
