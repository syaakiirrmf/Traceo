import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { TambahFasilitiForm } from './TambahFasilitiForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Facility' }

export default async function TambahFasilitiPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>
}) {
  const { kategori } = await searchParams
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || !hasPermission(userProfile.peranan, 'tambah_fasiliti')) {
    redirect('/dashboard/fasiliti')
  }

  const { data: pegawaiList } = await supabase
    .from('users')
    .select('id, nama')
    .eq('peranan', 'pegawai_susulan')
    .eq('status', 'aktif')
    .order('nama')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/fasiliti"
          className="w-8 h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Add Facility
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Register a new JV capital financing facility
          </p>
        </div>
      </div>

      <TambahFasilitiForm pegawaiList={pegawaiList ?? []} defaultKategori={(kategori as 'jv_syarikat' | 'jv_tanah' | 'pinjaman_individu') || 'jv_syarikat'} />
    </div>
  )
}
