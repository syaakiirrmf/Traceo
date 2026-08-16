'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Menu, AlertTriangle, Gavel, CheckCircle2 } from 'lucide-react'
import type { User } from '@/types'
import { getRoleLabel } from '@/lib/auth/permissions'
import type { SusulanNotification } from '@/lib/notifications'

interface TopBarProps {
  user: User
  notifications?: SusulanNotification[]
  onMenuToggle?: () => void
}

const STATUS_META: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  tertunggak: { label: 'Overdue', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  tindakan_guaman: {
    label: 'Legal Action',
    color: 'text-rose-600 bg-rose-50',
    icon: Gavel,
  },
  aktif: { label: 'Active', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  selesai: { label: 'Completed', color: 'text-slate-500 bg-slate-100', icon: CheckCircle2 },
}

export function TopBar({ user, notifications = [], onMenuToggle }: TopBarProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const count = notifications.length

  return (
    <header className="h-[68px] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30 font-dm">
      {/* Left: Hamburger menu toggle + current page greeting */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div id="topbar-title" className="text-sm font-medium text-slate-600 truncate">
          Welcome,{' '}
          <span className="font-fustat font-extrabold text-slate-900">
            {user.nama.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-slate-100/80 text-slate-600 border border-slate-200/80 shadow-2xs">
          built by <span className="text-[#0066FF] font-bold">@syaakiirr</span>
        </span>

        {/* Notifications dropdown */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 border border-slate-200/70 shadow-xs"
            aria-label="Notifications"
            aria-expanded={open}
          >
            <Bell size={16} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-fustat font-bold text-slate-900">Notifications</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {count} perlu perhatian
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {count === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs text-slate-500">
                      Tiada fasiliti yang memerlukan perhatian.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {notifications.map((n) => {
                      const meta = STATUS_META[n.status_fasiliti] ?? STATUS_META.aktif
                      const Icon = meta.icon
                      return (
                        <li key={n.id}>
                          <Link
                            href={`/dashboard/fasiliti/${n.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <span
                              className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}
                            >
                              <Icon size={13} />
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {n.kod_rujukan}
                                </span>
                                <span
                                  className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${meta.color}`}
                                >
                                  {meta.label}
                                </span>
                              </span>
                              <span className="block text-xs text-slate-600 truncate mt-0.5">
                                {n.nama_peminjam}
                              </span>
                              <span className="block text-[10.5px] text-slate-400 mt-0.5">
                                Tunggakan: RM{' '}
                                {n.jumlah_tunggakan_semasa.toLocaleString('ms-MY', {
                                  minimumFractionDigits: 2,
                                })}
                                {n.susulan_terakhir && ` · Susulan: ${n.susulan_terakhir}`}
                              </span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role badge */}
        <span className="px-3 py-1 rounded-full text-[11.5px] font-bold bg-[#EBF2FF] text-[#0066FF] border border-[#0066FF]/20 shadow-xs whitespace-nowrap">
          {getRoleLabel(user.peranan)}
        </span>
      </div>
    </header>
  )
}
