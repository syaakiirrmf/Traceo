import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getInitials } from '@/lib/utils'
import { getRoleLabel } from '@/lib/auth/permissions'
import { toggleUserStatus } from '@/lib/actions/users'
import { TambahUserModal } from './TambahUserModal'
import { UserCheck, UserX } from 'lucide-react'
import type { Metadata } from 'next'
import type { User } from '@/types'

export const metadata: Metadata = { title: 'User Management' }

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  pengurus: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border-[var(--color-brand-muted)]',
  pegawai_susulan: 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  viewer: 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] border-[var(--color-border)]',
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || userProfile.peranan !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('dicipta_pada', { ascending: false })

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Kawalan Pentadbiran
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">• {users?.length ?? 0} Akaun</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            Pengurusan Pengguna
          </h1>
        </div>
        <TambahUserModal />
      </div>

      {/* High-End Clean Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        {(!users || users.length === 0) ? (
          <div className="flex items-center justify-center py-16 text-xs text-[var(--color-text-tertiary)]">
            Tiada pengguna berdaftar dijumpai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Peranan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tarikh Berdaftar</th>
                  <th className="px-4 py-3 w-12 text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {(users ?? []).map((u: User) => (
                  <tr key={u.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-[var(--color-brand)]">
                            {getInitials(u.nama)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text-primary)] leading-snug">{u.nama}</p>
                          <p className="text-[11px] text-[var(--color-text-tertiary)]">{u.emel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${ROLE_STYLES[u.peranan] ?? ''}`}>
                        {getRoleLabel(u.peranan)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${u.status === 'aktif' ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30'}`}>
                        {u.status === 'aktif' ? 'Aktif' : 'Nyahaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-mono">
                      {formatDate(u.dicipta_pada)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={toggleUserStatus.bind(null, u.id, u.status)}>
                        <button
                          type="submit"
                          title={u.status === 'aktif' ? 'Nyahaktifkan' : 'Aktifkan'}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${u.status === 'aktif' ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]' : 'text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]'}`}
                        >
                          {u.status === 'aktif' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
