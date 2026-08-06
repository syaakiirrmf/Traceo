'use client'

import { useMemo, useState } from 'react'
import { formatDate, getInitials } from '@/lib/utils'
import { getRoleLabel } from '@/lib/auth/permissions'
import { toggleUserStatus } from '@/lib/actions/users'
import { TableSearch, matchesQuery } from '@/components/table/TableSearch'
import { UserCheck, UserX } from 'lucide-react'
import type { User } from '@/types'

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  pengurus: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border-[var(--color-brand-muted)]',
  pegawai_susulan: 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  viewer: 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] border-[var(--color-border)]',
}

export function UsersTable({ users }: { users: User[] }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visibleUsers = useMemo(() => {
    if (!q) return users
    return users.filter((u) =>
      [u.nama, u.emel, getRoleLabel(u.peranan), u.status === 'aktif' ? 'Active' : 'Inactive'].some(
        (v) => matchesQuery(v, q)
      )
    )
  }, [users, q])

  if (users.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="flex items-center justify-center py-16 text-xs text-[var(--color-text-tertiary)]">
          No registered users found.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Search name, email, role, status..."
          className="w-full sm:w-72"
        />
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {visibleUsers.length} of {users.length} accounts
        </p>
      </div>

      {/* High-End Clean Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered Date</th>
                <th className="px-4 py-3 w-12 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No accounts match your search.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u: User) => (
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
                        {u.status === 'aktif' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)] font-mono">
                      {formatDate(u.dicipta_pada)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={toggleUserStatus.bind(null, u.id, u.status)}>
                        <button
                          type="submit"
                          title={u.status === 'aktif' ? 'Deactivate' : 'Activate'}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${u.status === 'aktif' ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]' : 'text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]'}`}
                        >
                          {u.status === 'aktif' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
