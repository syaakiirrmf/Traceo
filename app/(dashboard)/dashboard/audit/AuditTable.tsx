'use client'

import { useMemo, useState } from 'react'
import { formatDate, getInitials } from '@/lib/utils'
import { TableSearch, TableSelect } from '@/components/table/TableSearch'
import { Pagination } from '@/components/table/Pagination'
import { Modal } from '@/components/ui/modal'
import {
  PlusCircle,
  Pencil,
  Trash2,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  UserCog,
  Eye,
  Copy,
  Check,
  ArrowUpDown,
  Filter,
  Layers,
  Building2,
  MapPin,
  CalendarDays,
  FileDown,
  User,
} from 'lucide-react'
import type { LogAudit } from '@/types'

const PAGE_SIZE = 12

interface ActionMeta {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badgeStyle: string
}

const ACTION_CONFIG: Record<string, ActionMeta> = {
  cipta_fasiliti: {
    label: 'Create Facility',
    icon: PlusCircle,
    badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  edit_fasiliti: {
    label: 'Edit Facility',
    icon: Pencil,
    badgeStyle: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  },
  padam_fasiliti: {
    label: 'Delete Facility',
    icon: Trash2,
    badgeStyle: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  },
  cipta_susulan: {
    label: 'Add Follow-up',
    icon: PlusCircle,
    badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  edit_susulan: {
    label: 'Edit Follow-up',
    icon: Pencil,
    badgeStyle: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  },
  padam_susulan: {
    label: 'Delete Follow-up',
    icon: Trash2,
    badgeStyle: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  },
  jana_kronologi: {
    label: 'Generate Chronology',
    icon: FileText,
    badgeStyle: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  },
  eksport_excel: {
    label: 'Export Excel',
    icon: FileSpreadsheet,
    badgeStyle: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  cipta_pengguna: {
    label: 'Create User',
    icon: UserCog,
    badgeStyle: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  },
  kemaskini_status_pengguna: {
    label: 'Toggle User Status',
    icon: UserCheck,
    badgeStyle: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  kemaskini_peranan: {
    label: 'Update Role',
    icon: ShieldCheck,
    badgeStyle: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
  kemaskini_pegawai: {
    label: 'Assign Officer',
    icon: User,
    badgeStyle: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
}

const ENTITY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; style: string }> = {
  fasiliti: {
    label: 'Facility',
    icon: Building2,
    style: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  tanah_jv: {
    label: 'Land JV',
    icon: MapPin,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  susulan: {
    label: 'Follow-up',
    icon: CalendarDays,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  users: {
    label: 'User Account',
    icon: User,
    style: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
}

type CategoryTab = 'all' | 'fasiliti' | 'tanah_jv' | 'susulan' | 'exports' | 'users'

export function AuditTable({ logs }: { logs: LogAudit[] }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [actionFilter, setActionFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<LogAudit | null>(null)
  const [copied, setCopied] = useState(false)

  // Unique actions list for dropdown filter
  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(logs.map((l) => l.tindakan).filter(Boolean)))
    return [
      { value: '', label: 'All Action Types' },
      ...actions.map((a) => ({
        value: a,
        label: ACTION_CONFIG[a]?.label ?? a,
      })),
    ]
  }, [logs])

  // Filtered & Sorted logs
  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase()

    return logs.filter((log) => {
      // 1. Category Tab Filter
      if (activeTab === 'fasiliti' && log.entiti_jenis !== 'fasiliti') return false
      if (activeTab === 'tanah_jv' && log.entiti_jenis !== 'tanah_jv') return false
      if (activeTab === 'susulan' && log.entiti_jenis !== 'susulan') return false
      if (activeTab === 'users' && log.entiti_jenis !== 'users') return false
      if (activeTab === 'exports' && !['jana_kronologi', 'eksport_excel'].includes(log.tindakan))
        return false

      // 2. Action Filter
      if (actionFilter && log.tindakan !== actionFilter) return false

      // 3. Search Query
      if (q) {
        const actionLabel = ACTION_CONFIG[log.tindakan]?.label ?? log.tindakan
        const haystack = [
          log.user?.nama,
          log.user?.emel,
          actionLabel,
          log.tindakan,
          log.entiti_jenis,
          log.butiran ? JSON.stringify(log.butiran) : '',
        ]
          .map((v) => String(v ?? ''))
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })
  }, [logs, activeTab, actionFilter, query])

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const timeA = new Date(a.tarikh).getTime()
      const timeB = new Date(b.tarikh).getTime()
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
    })
  }, [filteredLogs, sortOrder])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageLogs = sortedLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleCopyJson = () => {
    if (!selectedLog) return
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDetailPreview = (log: LogAudit) => {
    if (!log.butiran || Object.keys(log.butiran).length === 0) {
      return <span className="text-[11px] text-[var(--color-text-tertiary)] italic">No additional payload</span>
    }

    const b = log.butiran as Record<string, unknown>

    if (b.filename || b.format) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
          <FileDown size={12} className="text-[var(--color-brand)]" />
          <strong className="uppercase">{String(b.format ?? 'DOC')}</strong>: {String(b.filename ?? '')}
        </span>
      )
    }

    if (b.kod_rujukan) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--color-text-primary)]">
          <span className="text-[var(--color-text-tertiary)]">Ref:</span> {String(b.kod_rujukan)}
        </span>
      )
    }

    if (b.status) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
          Status: <strong className="font-mono text-[var(--color-text-primary)]">{String(b.status)}</strong>
        </span>
      )
    }

    // Default compact key values
    const entries = Object.entries(b).slice(0, 2)
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {entries.map(([k, v]) => (
          <span
            key={k}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
          >
            <span className="text-[var(--color-text-tertiary)]">{k}:</span>
            <span className="ml-1 text-[var(--color-text-primary)] font-medium truncate max-w-[120px]">
              {String(v)}
            </span>
          </span>
        ))}
      </div>
    )
  }

  const categoryTabs: Array<{ key: CategoryTab; label: string; count: number }> = [
    { key: 'all', label: 'All Activities', count: logs.length },
    { key: 'fasiliti', label: 'Facilities', count: logs.filter((l) => l.entiti_jenis === 'fasiliti').length },
    { key: 'tanah_jv', label: 'Land JV', count: logs.filter((l) => l.entiti_jenis === 'tanah_jv').length },
    { key: 'susulan', label: 'Follow-ups', count: logs.filter((l) => l.entiti_jenis === 'susulan').length },
    { key: 'exports', label: 'Exports & PDF', count: logs.filter((l) => ['jana_kronologi', 'eksport_excel'].includes(l.tindakan)).length },
    { key: 'users', label: 'Users', count: logs.filter((l) => l.entiti_jenis === 'users').length },
  ]

  if (logs.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-tertiary)] mb-3">
          <Layers size={20} />
        </div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] font-fustat">
          No Audit Trail Records
        </h3>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1 max-w-sm mx-auto">
          System events such as facility updates, follow-up logs, and document downloads will appear here in realtime.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--color-border)]">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                setPage(1)
              }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--color-brand)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
          <TableSearch
            value={query}
            onChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder="Search by user, email, action, entity..."
            className="w-full sm:w-80"
          />

          <TableSelect
            label="Filter Action"
            value={actionFilter}
            onChange={(v) => {
              setActionFilter(v)
              setPage(1)
            }}
            options={actionOptions}
            className="w-full sm:w-56"
          />

          {(query || actionFilter || activeTab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setActionFilter('')
                setActiveTab('all')
                setPage(1)
              }}
              className="px-3 h-9 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors self-end"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <ArrowUpDown size={13} />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          <span className="text-xs font-mono font-medium text-[var(--color-text-tertiary)]">
            {sortedLogs.length} of {logs.length} logs
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] uppercase tracking-wider bg-[var(--color-surface-raised)] font-bold text-[10px]">
                <th className="px-4 py-3.5 w-44">Timestamp</th>
                <th className="px-4 py-3.5 min-w-[200px]">Actor / User</th>
                <th className="px-4 py-3.5 min-w-[180px]">Action Performed</th>
                <th className="px-4 py-3.5 w-36">Entity Target</th>
                <th className="px-4 py-3.5">Details / Payload</th>
                <th className="px-3 py-3.5 w-12 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter size={20} className="opacity-40" />
                      <p className="font-medium text-xs text-[var(--color-text-secondary)]">
                        No audit records match your current filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setActionFilter('')
                          setActiveTab('all')
                        }}
                        className="text-xs font-bold text-[var(--color-brand)] hover:underline mt-1"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageLogs.map((log) => {
                  const actionMeta = ACTION_CONFIG[log.tindakan] ?? {
                    label: log.tindakan,
                    icon: ShieldCheck,
                    badgeStyle:
                      'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
                  }
                  const ActionIcon = actionMeta.icon
                  const entityMeta = ENTITY_CONFIG[log.entiti_jenis]

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">
                          {formatDate(log.tarikh, 'dd/MM/yyyy')}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                          {formatDate(log.tarikh, 'HH:mm:ss a')}
                        </div>
                      </td>

                      {/* Actor / User */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {log.user?.nama ? getInitials(log.user.nama) : 'SY'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--color-text-primary)] leading-snug truncate">
                              {log.user?.nama ?? 'System Service'}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono truncate">
                              {log.user?.emel ?? 'auto@traceo.sys'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${actionMeta.badgeStyle}`}
                        >
                          <ActionIcon size={12} className="shrink-0" />
                          <span>{actionMeta.label}</span>
                        </span>
                      </td>

                      {/* Entity Target */}
                      <td className="px-4 py-3.5 align-middle">
                        {entityMeta ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${entityMeta.style}`}
                          >
                            <entityMeta.icon size={11} className="shrink-0" />
                            <span>{entityMeta.label}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            {log.entiti_jenis}
                          </span>
                        )}
                      </td>

                      {/* Details / Payload summary */}
                      <td className="px-4 py-3.5 align-middle">
                        {formatDetailPreview(log)}
                      </td>

                      {/* Quick Inspect Button */}
                      <td className="px-3 py-3.5 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect full audit record"
                          className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-surface-raised)] transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={sortedLogs.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Details & Payload Inspector Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Details"
        description="Comprehensive audit event log data payload"
        icon={<ShieldCheck size={18} />}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-dm">
            {/* Top metadata grid */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">
                  Event Action
                </span>
                <p className="font-bold text-[var(--color-text-primary)] mt-0.5">
                  {ACTION_CONFIG[selectedLog.tindakan]?.label ?? selectedLog.tindakan}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">
                  Timestamp
                </span>
                <p className="font-mono font-medium text-[var(--color-text-primary)] mt-0.5">
                  {formatDate(selectedLog.tarikh, 'dd MMMM yyyy, HH:mm:ss')}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">
                  User Actor
                </span>
                <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                  {selectedLog.user?.nama ?? 'System'}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                  {selectedLog.user?.emel ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">
                  Target Entity
                </span>
                <p className="font-mono font-bold text-[var(--color-text-primary)] mt-0.5">
                  {selectedLog.entiti_jenis}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono truncate">
                  ID: {selectedLog.entiti_id}
                </p>
              </div>
            </div>

            {/* Structured JSON payload viewer */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1.5">
                Audit Payload (Details)
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                {JSON.stringify(selectedLog.butiran ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

