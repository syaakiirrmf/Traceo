'use client'

import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { TableSearch } from '@/components/table/TableSearch'
import type { LogAudit } from '@/types'

const TINDAKAN_LABELS: Record<string, string> = {
  cipta_fasiliti: 'Add Facility',
  edit_fasiliti: 'Edit Facility',
  padam_fasiliti: 'Delete Facility',
  cipta_susulan: 'Add Follow-up',
  edit_susulan: 'Edit Follow-up',
  padam_susulan: 'Delete Follow-up',
  jana_kronologi: 'Generate Chronology',
  cipta_pengguna: 'Add User',
  kemaskini_status_pengguna: 'Update User Status',
  kemaskini_peranan: 'Update Role',
  kemaskini_pegawai: 'Assign Officer',
}

export function AuditTable({ logs }: { logs: LogAudit[] }) {
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visibleLogs = useMemo(() => {
    if (!q) return logs
    return logs.filter((log) => {
      const actionLabel = TINDAKAN_LABELS[log.tindakan] ?? log.tindakan
      const haystack = [
        log.user?.nama,
        log.user?.emel,
        actionLabel,
        log.entiti_jenis,
        log.butiran ? JSON.stringify(log.butiran) : '',
      ]
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [logs, q])

  if (logs.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="flex items-center justify-center py-16 text-xs text-[var(--color-text-tertiary)]">
          No audit logs found.
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
          placeholder="Search user, action, entity..."
          className="w-full sm:w-72"
        />
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {visibleLogs.length} of {logs.length} logs
        </p>
      </div>

      {/* High-End Clean Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                <th className="px-4 py-3">Time &amp; Date</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity &amp; Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    No logs match your search.
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group">
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)] whitespace-nowrap font-mono">
                      {formatDate(log.tarikh, 'dd/MM/yy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--color-text-primary)] leading-snug">
                        {log.user?.nama ?? '—'}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {log.user?.emel ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        {TINDAKAN_LABELS[log.tindakan] ?? log.tindakan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">{log.entiti_jenis}</span>
                      {log.butiran && (
                        <p className="text-[11px] mt-0.5 text-[var(--color-text-tertiary)] font-mono truncate max-w-xs">
                          {JSON.stringify(log.butiran)}
                        </p>
                      )}
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