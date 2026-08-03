import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log System' }

const TINDAKAN_LABELS: Record<string, string> = {
  cipta_fasiliti: 'Tambah Fasiliti',
  edit_fasiliti: 'Edit Fasiliti',
  padam_fasiliti: 'Padam Fasiliti',
  cipta_susulan: 'Tambah Susulan',
  edit_susulan: 'Edit Susulan',
  padam_susulan: 'Padam Susulan',
  jana_kronologi: 'Jana Kronologi',
  cipta_pengguna: 'Tambah Pengguna',
  kemaskini_status_pengguna: 'Kemaskini Status Pengguna',
  kemaskini_peranan: 'Kemaskini Peranan',
  kemaskini_pegawai: 'Lantik Pegawai',
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || userProfile.peranan !== 'admin') redirect('/dashboard')

  const { data: logs } = await supabase
    .from('log_audit')
    .select('*, user:users(nama, emel)')
    .order('tarikh', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Keselamatan &amp; Jejak Aktiviti
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">• {logs?.length ?? 0} Log Terkini</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
            Log Audit Sistem
          </h1>
        </div>
      </div>

      {/* High-End Clean Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        {(!logs || logs.length === 0) ? (
          <div className="flex items-center justify-center py-16 text-xs text-[var(--color-text-tertiary)]">
            Tiada log audit dijumpai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-medium">
                  <th className="px-4 py-3">Masa &amp; Tarikh</th>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Tindakan</th>
                  <th className="px-4 py-3">Entiti &amp; Butiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {logs.map((log) => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
