import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { kemaskiniProfil, tukarKataLaluan } from '@/lib/actions/profil'
import { getRoleLabel } from '@/lib/auth/permissions'
import { getInitials } from '@/lib/utils'
import { ProfilToast } from './ProfilToast'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          My Profile
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Update account information and password
        </p>
      </div>

      {/* Success toast */}
      <ProfilToast success={params.success} />

      {/* Avatar + role */}
      <div className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)]">
        <div className="w-14 h-14 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-[var(--color-brand)]">
            {getInitials(userProfile.nama)}
          </span>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{userProfile.nama}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{userProfile.emel}</p>
          <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
            {getRoleLabel(userProfile.peranan)}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">
          Personal Information
        </h2>
        <form action={kemaskiniProfil} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Full Name <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              name="nama"
              required
              defaultValue={userProfile.nama}
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Email
            </label>
            <input
              type="email"
              value={userProfile.emel}
              disabled
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-tertiary)] cursor-not-allowed"
            />
            <p className="text-xs text-[var(--color-text-tertiary)]">Email cannot be changed</p>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
          >
            Save changes
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-3">
          Change Password
        </h2>
        <form action={tukarKataLaluan} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              New Password <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="password"
              name="kata_laluan"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Confirm Password <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="password"
              name="sahkan_kata_laluan"
              required
              minLength={8}
              placeholder="Repeat new password"
              className="w-full h-10 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Change password
          </button>
        </form>
      </section>
    </div>
  )
}
