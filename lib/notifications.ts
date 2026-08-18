import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'
import { differenceInCalendarDays } from 'date-fns'

export interface SusulanNotification {
  id: string
  kod_rujukan: string
  nama_peminjam: string
  status_fasiliti: string
  jumlah_tunggakan_semasa: number
  susulan_terakhir: string | null
  hari_terlewat: number
  kritikal: boolean
}

// Notifications = facilities in an attention-needed state (overdue / legal
// action). For pegawai_susulan, scoped to their assigned facilities only.
export async function getSusulanNotifications(
  supabase: SupabaseClient,
  profile: { id: string; peranan: UserRole }
): Promise<SusulanNotification[]> {
  const needsAttention = ['tertunggak', 'tindakan_guaman']

  let query = supabase
    .from('fasiliti')
    .select(
      'id, kod_rujukan, nama_peminjam, status_fasiliti, jumlah_tunggakan_semasa, tarikh_mula, susulan!susulan_fasiliti_id_fkey(tarikh_susulan)'
    )
    .in('status_fasiliti', needsAttention)
    .order('jumlah_tunggakan_semasa', { ascending: false })

  if (profile.peranan === 'pegawai_susulan') {
    const { data: assigned } = await supabase
      .from('fasiliti_pegawai')
      .select('fasiliti_id')
      .eq('user_id', profile.id)
    const ids = (assigned ?? []).map((r) => r.fasiliti_id as string)
    query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query.limit(20)

  if (error) {
    console.error('[getSusulanNotifications]', error)
    return []
  }

  return (data ?? []).map((f) => {
    const susulan = (f.susulan ?? []) as Array<{ tarikh_susulan: string }>
    const latest = susulan
      .map((s) => s.tarikh_susulan)
      .sort()
      .reverse()[0]
    // Days since the last follow-up (or since the facility started if none).
    const anchor = latest ?? f.tarikh_mula ?? new Date().toISOString()
    const days = Math.max(differenceInCalendarDays(new Date(), new Date(anchor)), 0)
    return {
      id: f.id,
      kod_rujukan: f.kod_rujukan,
      nama_peminjam: f.nama_peminjam,
      status_fasiliti: f.status_fasiliti,
      jumlah_tunggakan_semasa: Number(f.jumlah_tunggakan_semasa) || 0,
      susulan_terakhir: latest ?? null,
      hari_terlewat: days,
      kritikal: days > 90,
    }
  })
}
