'use client'

import React from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { User } from '@/types'

export interface OfficerDashboardViewProps {
  user: User
  assignedFasiliti: Array<{
    id: string
    kod_rujukan: string
    nama_peminjam: string
    kategori: string
    jumlah_pembiayaan: number
    jumlah_tunggakan_semasa: number
    status_fasiliti: string
  }>
  recentSusulan: Array<{
    id: string
    fasiliti_id: string
    tarikh_susulan: string
    catatan: string
    status_kelulusan?: 'menunggu' | 'diluluskan' | 'ditolak' | null
    kod_rujukan?: string
    nama_peminjam?: string
  }>
}

const APPROVAL_STYLES = {
  menunggu: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  diluluskan: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  ditolak: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
} as const

const APPROVAL_LABELS = {
  menunggu: 'Menunggu',
  diluluskan: 'Diluluskan',
  ditolak: 'Ditolak',
} as const

const STATUS_STYLES = {
  aktif: 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/20',
  tertunggak: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  tindakan_guaman: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  selesai: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
} as const

const STATUS_LABELS = {
  aktif: 'Active',
  tertunggak: 'Overdue',
  tindakan_guaman: 'Legal Action',
  selesai: 'Completed',
} as const

export function OfficerDashboardView({
  user,
  assignedFasiliti,
  recentSusulan,
}: OfficerDashboardViewProps) {
  const overdueCount = assignedFasiliti.filter(
    (f) => f.status_fasiliti === 'tertunggak' || f.status_fasiliti === 'tindakan_guaman'
  ).length
  const totalArrears = assignedFasiliti.reduce(
    (s, f) => s + (Number(f.jumlah_tunggakan_semasa) || 0),
    0
  )

  return (
    <div className="space-y-6 max-w-[1600px] p-6 font-dm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border border-[#0066FF]/20 bg-[#EBF2FF] text-[#0066FF]">
              <UserCheck size={12} />
              Officer Workspace &bull; Personal Assignment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-fustat font-black tracking-tight text-slate-900">
            Officer Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome, <span className="font-semibold text-slate-800">{user.nama}</span>.
            Here are your list of facilities and follow-up assignments.
          </p>
        </div>

        {/* Quick Officer Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/assistant"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#0066FF]/20 bg-[#EBF2FF] text-xs font-bold text-[#0066FF] hover:bg-[#0066FF] hover:text-white transition-all duration-200 shadow-xs"
          >
            <Sparkles size={14} />
            Ask @syaakiirr
          </Link>
          <Link
            href="/dashboard/fasiliti"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-all duration-200 shadow-xs font-fustat"
          >
            <Building2 size={14} />
            View Assigned Facilities ({assignedFasiliti.length})
          </Link>
        </div>
      </div>

      {/* Officer Personal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Assigned Facilities */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Facilities
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {assignedFasiliti.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Facilities under your supervision</p>
        </div>

        {/* Needing Follow-up */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overdue / Attention Needing
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-amber-600 tracking-tight">
            {overdueCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total arrears:{' '}
            <span className="font-bold text-slate-700">{formatCurrency(totalArrears)}</span>
          </p>
        </div>

        {/* My Recent Entries */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Follow-ups Logged
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-fustat font-black text-slate-900 tracking-tight">
            {recentSusulan.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Follow-up records you recently updated</p>
        </div>
      </div>

      {/* Main Content Grid: Assigned Facilities Cards + Recent Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Assigned Facilities Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-fustat font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-[#0066FF]" />
              My Assigned Facilities ({assignedFasiliti.length})
            </h2>
            <Link
              href="/dashboard/fasiliti"
              className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {assignedFasiliti.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
              <p className="text-sm font-semibold text-slate-600">
                No facilities have been assigned to you yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Please contact the Admin or Manager for account assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignedFasiliti.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0066FF]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0066FF] bg-[#EBF2FF] px-2.5 py-0.5 rounded-md">
                        {f.kod_rujukan}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          STATUS_STYLES[f.status_fasiliti as keyof typeof STATUS_STYLES] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[f.status_fasiliti as keyof typeof STATUS_LABELS] ||
                          f.status_fasiliti}
                      </span>
                    </div>

                    <h3 className="font-fustat font-bold text-base text-slate-900 leading-snug">
                      {f.nama_peminjam}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Financing:{' '}
                      <span className="font-medium text-slate-700">
                        {formatCurrency(f.jumlah_pembiayaan)}
                      </span>
                    </p>

                    {Number(f.jumlah_tunggakan_semasa) > 0 && (
                      <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-50 px-2.5 py-1 rounded-lg inline-block">
                        Arrears: {formatCurrency(f.jumlah_tunggakan_semasa)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/fasiliti/${f.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-[#0066FF] transition-colors"
                    >
                      Details &rarr;
                    </Link>
                    <Link
                      href={`/dashboard/fasiliti/${f.id}/susulan/tambah`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF] text-white text-xs font-bold hover:bg-[#0048CC] transition-colors shadow-xs"
                    >
                      <Plus size={13} />+ Log Follow-up
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Susulan Activity Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-fustat font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-[#0066FF]" />
            My Recent Follow-up Entries
          </h2>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            {recentSusulan.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No follow-up records have been logged by you yet.
              </p>
            ) : (
              recentSusulan.map((s) => (
                <div
                  key={s.id}
                  className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-bold text-[#0066FF]">
                      {s.kod_rujukan || 'JV'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={11} /> {s.tarikh_susulan}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">{s.nama_peminjam}</p>
                    {s.status_kelulusan && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          APPROVAL_STYLES[s.status_kelulusan] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {APPROVAL_LABELS[s.status_kelulusan] || s.status_kelulusan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {s.catatan}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
