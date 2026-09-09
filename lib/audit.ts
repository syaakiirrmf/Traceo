import 'server-only'

import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuditTindakan = 'jana_kronologi' | 'eksport_excel' | 'eksport_ringkasan'
type AuditEntiti = 'fasiliti' | 'susulan' | 'tanah_jv' | 'user'

/**
 * Tulis audit via SECURITY DEFINER RPC `traceo_audit`.
 * Best-effort: kegagalan audit tidak menggagalkan eksport,
 * tetapi dilog ke Sentry (menutup jurang forensik #28).
 */
export async function tulisAudit(
  supabase: SupabaseClient,
  tindakan: AuditTindakan,
  entitiJenis: AuditEntiti,
  entitiId: string | null,
  butiran?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('traceo_audit', {
    p_tindakan: tindakan,
    p_entiti_jenis: entitiJenis,
    p_entiti_id: entitiId,
    p_butiran: (butiran ?? null) as unknown as never,
  })
  if (error) {
    Sentry.captureMessage('audit_insert_failed', {
      level: 'warning',
      extra: { tindakan, entitiJenis, entitiId, message: error.message },
    })
    console.error('[Audit Error]', error)
  }
}
