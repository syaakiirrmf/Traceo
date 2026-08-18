'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { lulusSusulan } from '@/lib/actions/susulan'
import { lulusSusulanTanah } from '@/lib/actions/tanah_jv_susulan'
import { toast } from '@/components/ui/toast'

const STATUS_META: Record<
  'menunggu' | 'diluluskan' | 'ditolak',
  { label: string; className: string }
> = {
  menunggu: {
    label: 'Pending Approval',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
  },
  diluluskan: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
  },
  ditolak: {
    label: 'Rejected',
    className: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
  },
}

export function SusulanApprovalBadge({
  status,
}: {
  status?: 'menunggu' | 'diluluskan' | 'ditolak'
}) {
  const meta = STATUS_META[status ?? 'menunggu']
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.className}`}
    >
      {status === 'diluluskan' ? (
        <CheckCircle2 size={10} />
      ) : status === 'ditolak' ? (
        <XCircle size={10} />
      ) : (
        <Clock size={10} />
      )}
      {meta.label}
    </span>
  )
}

export function SusulanApprovalButtons({
  susulanId,
  fasilitiId,
  status,
  isTanah = false,
}: {
  susulanId: string
  fasilitiId: string
  status?: 'menunggu' | 'diluluskan' | 'ditolak'
  isTanah?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handle(keputusan: 'diluluskan' | 'ditolak') {
    setBusy(true)
    try {
      if (isTanah) {
        await lulusSusulanTanah(susulanId, fasilitiId, keputusan)
      } else {
        await lulusSusulan(susulanId, fasilitiId, keputusan)
      }
      toast.success(keputusan === 'diluluskan' ? 'Follow-up approved' : 'Follow-up rejected')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update approval')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {status !== 'diluluskan' && (
        <button
          onClick={() => handle('diluluskan')}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          title="Approve follow-up"
        >
          <CheckCircle2 size={12} />
          Approve
        </button>
      )}
      {status !== 'ditolak' && (
        <button
          onClick={() => handle('ditolak')}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
          title="Reject follow-up"
        >
          <XCircle size={12} />
          Reject
        </button>
      )}
    </div>
  )
}