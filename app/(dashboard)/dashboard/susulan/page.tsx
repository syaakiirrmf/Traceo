import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { assertPageAccess } from '@/lib/auth/access-control'
import { FollowUpCalendar } from '@/components/calendar/FollowUpCalendar'
import { hasPermission } from '@/lib/auth/permissions'
import type { Metadata } from 'next'
import type { UserRole } from '@/types'

export const metadata: Metadata = { title: 'Follow-Up Calendar' }

export interface CalendarEvent {
  id: string
  tarikh: string
  catatan: string
  kod_rujukan: string
  nama_peminjam: string
  entiti: 'fasiliti' | 'tanah'
  entiti_id: string
  dicatat_oleh: string
}

export default async function SusulanCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ skop?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()
  if (!userProfile) redirect('/login')

  await assertPageAccess(userProfile.id, userProfile.peranan as UserRole, '/dashboard/susulan')

  const isPegawai = userProfile.peranan === 'pegawai_susulan'

  let assignedIds: string[] | null = null
  if (isPegawai) {
    const { data: assigned } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('user_id', userProfile.id)
    assignedIds = (assigned ?? []).map((r) => r.fasiliti_id as string)
    if (assignedIds.length === 0) {
      assignedIds = ['00000000-0000-0000-0000-000000000000']
    }
  }

  let query = supabase
    .from('susulan')
    .select(
      'id, tarikh_susulan, catatan, fasiliti_id, tanah_id, dicatat_oleh, fasiliti:fasiliti!susulan_fasiliti_id_fkey(kod_rujukan, nama_peminjam)'
    )
    .order('tarikh_susulan', { ascending: true })
    .limit(2000)

  // Tetingkap 3 bulan secara lalai (elak muat seluruh sejarah); ?skop=semua untuk penuh.
  const skop = (await searchParams).skop
  if (skop !== 'semua') {
    const now = new Date()
    const dari = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const hingga = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10)
    query = query.gte('tarikh_susulan', dari).lte('tarikh_susulan', hingga)
  }

  if (assignedIds !== null) query = query.in('fasiliti_id', assignedIds)

  const { data: susulan, error } = await query

  const events: CalendarEvent[] = (susulan ?? [])
    .filter((s) => s.tarikh_susulan)
    .map((s) => {
      const fasiliti = Array.isArray(s.fasiliti) ? s.fasiliti[0] : s.fasiliti
      return {
        id: s.id,
        tarikh: s.tarikh_susulan,
        catatan: s.catatan ?? '',
        kod_rujukan: fasiliti?.kod_rujukan ?? '—',
        nama_peminjam: fasiliti?.nama_peminjam ?? '—',
        entiti: s.tanah_id ? ('tanah' as const) : ('fasiliti' as const),
        entiti_id: s.tanah_id ?? s.fasiliti_id ?? '',
        dicatat_oleh: s.dicatat_oleh,
      }
    })

  const canAdd = hasPermission(userProfile.peranan, 'tambah_susulan')

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Follow-Up Management
        </span>
        <h1 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)] mt-0.5">
          Follow-Up Calendar
        </h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          {isPegawai ? 'Your assigned facilities' : 'All follow-ups across facilities'} •{' '}
          {events.length} events{skop === 'semua' ? ' (semua)' : ' (3 bulan)'}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)] p-4 text-xs text-[var(--color-danger)]">
          Failed to load calendar events.
        </div>
      ) : (
        <FollowUpCalendar events={events} canAdd={canAdd} />
      )}
    </div>
  )
}