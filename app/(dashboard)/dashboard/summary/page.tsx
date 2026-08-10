import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Summary — JV' }

export default async function SummaryIndexPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  // Fetch counts & totals in parallel
  const [{ data: jv1Data }, { data: jv2Data }, { data: jv3Data }, { data: tanahData }] =
    await Promise.all([
      supabase
        .from('fasiliti')
        .select('id, jumlah_pembiayaan, jumlah_tunggakan_semasa')
        .eq('kategori', 'jv_syarikat'),
      supabase
        .from('fasiliti')
        .select('id, jumlah_pembiayaan, jumlah_tunggakan_semasa')
        .eq('kategori', 'jv_tanah'),
      supabase
        .from('fasiliti')
        .select('id, jumlah_pembiayaan, jumlah_tunggakan_semasa')
        .eq('kategori', 'pinjaman_individu'),
      supabase
        .from('tanah_jv')
        .select('id, anggaran_nilaian, luas_meter_persegi'),
    ])

  const jv1 = jv1Data ?? []
  const jv2 = jv2Data ?? []
  const jv3 = jv3Data ?? []
  const tanah = tanahData ?? []

  const sum = (arr: Array<Record<string, unknown>>, key: string) =>
    arr.reduce((s, r) => s + (Number(r[key]) || 0), 0)

  const cards = [
    {
      href: '/dashboard/summary/jv1',
      title: 'Summary JV 1',
      category: 'Company Joint Venture',
      description: 'Capital financing, profit dividends, arrears & company asset collateral',
      count: jv1.length,
      hasArrears: sum(jv1, 'jumlah_tunggakan_semasa') > 0,
      stats: [
        { label: 'Total Financing', value: formatCurrency(sum(jv1, 'jumlah_pembiayaan')) },
        { label: 'Total Arrears', value: formatCurrency(sum(jv1, 'jumlah_tunggakan_semasa')), isArrears: sum(jv1, 'jumlah_tunggakan_semasa') > 0 },
      ],
    },
    {
      href: '/dashboard/summary/jv2',
      title: 'Land JV',
      category: 'Land Joint Venture',
      description: 'Contractor capital financing, profit sharing & property information',
      count: jv2.length,
      hasArrears: sum(jv2, 'jumlah_tunggakan_semasa') > 0,
      stats: [
        { label: 'Total Financing', value: formatCurrency(sum(jv2, 'jumlah_pembiayaan')) },
        { label: 'Total Arrears', value: formatCurrency(sum(jv2, 'jumlah_tunggakan_semasa')), isArrears: sum(jv2, 'jumlah_tunggakan_semasa') > 0 },
      ],
    },
    {
      href: '/dashboard/summary/jv3',
      title: 'Personal Loan',
      category: 'Individual Loan',
      description: 'Individual financing, profit sharing & collateral (A + B = C)',
      count: jv3.length,
      hasArrears: sum(jv3, 'jumlah_tunggakan_semasa') > 0,
      stats: [
        { label: 'Total Financing', value: formatCurrency(sum(jv3, 'jumlah_pembiayaan')) },
        { label: 'Total Arrears', value: formatCurrency(sum(jv3, 'jumlah_tunggakan_semasa')), isArrears: sum(jv3, 'jumlah_tunggakan_semasa') > 0 },
      ],
    },
    {
      href: '/dashboard/summary/tanah-md',
      title: 'Tanah MD (JV)',
      category: 'Land Registration',
      description: 'Land title, title information, area & collateral asset value',
      count: tanah.length,
      hasArrears: false,
      stats: [
        { label: 'Total Land Lots', value: tanah.length + ' lots' },
        { label: 'Total Collateral Value', value: formatCurrency(sum(tanah, 'anggaran_nilaian')) },
      ],
    },
  ]

  const totalTunggakanKeseluruhan =
    sum(jv1, 'jumlah_tunggakan_semasa') +
    sum(jv2, 'jumlah_tunggakan_semasa') +
    sum(jv3, 'jumlah_tunggakan_semasa')

  return (
    <div className="space-y-8 max-w-5xl font-dm">
      {/* Page Header: Pure Typography */}
      <div className="border-b border-slate-200/70 pb-4">
        <h1 className="text-2xl font-fustat font-black tracking-tight text-slate-900">
          JV &amp; Land Financing Summary
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a table category to view full details.
        </p>
      </div>

      {/* Modern Typography-First Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            transitionTypes={['nav-forward']}
            className={`group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#0066FF]/30 transition-all flex flex-col justify-between gap-4 no-underline ${
              card.hasArrears ? 'border-l-4 border-l-red-500' : ''
            }`}
          >
            {/* Top row: category label & count */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {card.category}
              </span>
              <span className="text-xs font-mono font-bold text-[#0066FF] bg-[#EBF2FF] px-2.5 py-0.5 rounded-full border border-[#0066FF]/20">
                {card.count} records
              </span>
            </div>

            {/* Title & description */}
            <div className="space-y-1">
              <h2 className="text-lg font-fustat font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors flex items-center justify-between">
                <span>{card.title}</span>
                <ArrowRight size={15} className="text-slate-400 group-hover:text-[#0066FF] group-hover:translate-x-1 transition-all" />
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Minimal Stat Band */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
              {card.stats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 truncate">{s.label}</p>
                  <p className={`font-fustat font-bold truncate text-sm mt-0.5 ${s.isArrears ? 'text-red-600' : 'text-slate-900'}`} title={s.value}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Aggregate Strip (Clean Typography Only) */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          System-Wide Aggregate
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-text-tertiary)] truncate">Total Facilities</p>
            <p className="font-mono font-bold text-[var(--color-text-primary)] truncate">{jv1.length + jv2.length + jv3.length} Records</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-text-tertiary)] truncate">Total Financing</p>
            <p className="font-mono font-bold text-[var(--color-text-primary)] truncate" title={formatCurrency(sum(jv1, 'jumlah_pembiayaan') + sum(jv2, 'jumlah_pembiayaan') + sum(jv3, 'jumlah_pembiayaan'))}>
              {formatCurrency(sum(jv1, 'jumlah_pembiayaan') + sum(jv2, 'jumlah_pembiayaan') + sum(jv3, 'jumlah_pembiayaan'))}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-text-tertiary)] truncate">Total Arrears</p>
            <p className={`font-mono font-bold truncate ${totalTunggakanKeseluruhan > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}`} title={formatCurrency(totalTunggakanKeseluruhan)}>
              {formatCurrency(totalTunggakanKeseluruhan)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-text-tertiary)] truncate">Collateral Value (Land)</p>
            <p className="font-mono font-bold text-[var(--color-text-primary)] truncate" title={formatCurrency(sum(tanah, 'anggaran_nilaian'))}>
              {formatCurrency(sum(tanah, 'anggaran_nilaian'))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
