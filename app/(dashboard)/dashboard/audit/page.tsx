import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { AuditTable } from './AuditTable'
import { Activity, ShieldCheck, FileText, Layers, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Log System — Traceo' }

export default async function AuditPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || !hasPermission(userProfile.peranan, 'lihat_audit_log')) redirect('/dashboard')

  const { data: logsData } = await supabase
    .from('log_audit')
    .select('*, user:users(nama, emel)')
    .order('tarikh', { ascending: false })
    .limit(300)

  const logs = logsData ?? []

  // Compute metrics
  const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size
  const exportCount = logs.filter(
    (l) => l.tindakan === 'jana_kronologi' || l.tindakan === 'eksport_excel'
  ).length
  const facilityLandOps = logs.filter(
    (l) => l.entiti_jenis === 'fasiliti' || l.entiti_jenis === 'tanah_jv'
  ).length

  return (
    <div className="space-y-6 max-w-[1600px] font-dm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20">
              <ShieldCheck size={12} />
              Security Audit
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              • Realtime Activity Trace
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1 font-fustat">
            System Audit Log
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Immutable tracking trail of user modifications, document generation, and administrative actions.
          </p>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Total Log Entries
            </p>
            <p className="text-lg font-bold font-fustat text-[var(--color-text-primary)]">
              {logs.length}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Active Actors
            </p>
            <p className="text-lg font-bold font-fustat text-[var(--color-text-primary)]">
              {uniqueUsers} Users
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Documents &amp; Exports
            </p>
            <p className="text-lg font-bold font-fustat text-[var(--color-text-primary)]">
              {exportCount}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Facility &amp; Land Events
            </p>
            <p className="text-lg font-bold font-fustat text-[var(--color-text-primary)]">
              {facilityLandOps}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Audit Client Table */}
      <AuditTable logs={logs} />
    </div>
  )
}

