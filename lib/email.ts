import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'Traceo <onboarding@resend.dev>'

// resend requires a real API key; a placeholder/empty value means emailing is
// disabled (e.g. local dev). We fall back to console logging so the rest of the
// flow is unaffected.
const isConfigured = Boolean(RESEND_API_KEY && !RESEND_API_KEY.startsWith('re_placeholder'))
const resend = isConfigured ? new Resend(RESEND_API_KEY) : null

type SendInput = {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendInput): Promise<void> {
  if (!resend) {
    console.info('[email] not configured, skipping:', { to, subject })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })
    if (error) console.error('[email] send failed:', error.message)
  } catch (err) {
    console.error('[email] send threw:', err)
  }
}

const layout = (title: string, body: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 28px;background:#0066FF;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Traceo</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${title}</h1>
                <div style="color:#334155;font-size:14px;line-height:1.6;">${body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <span style="color:#94a3b8;font-size:12px;">System-generated notification — Traceo</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    const m: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return m[c]
  })
}

export function sendOverdueEmail(to: string, data: { kod_rujukan: string; nama_peminjam: string; jumlah_tunggakan: number }): Promise<void> {
  return sendEmail({
    to,
    subject: `[Traceo] Peringatan Fasiliti Tertunggak — ${data.kod_rujukan}`,
    html: layout(
      'Peringatan Fasiliti Tertunggak',
      `<p>Fasiliti berikut kini berstatus <strong>tertunggak</strong> dan memerlukan perhatian:</p>
       <table style="width:100%;border-collapse:collapse;margin-top:8px;">
         <tr><td style="padding:6px 0;color:#475569;">Kod Rujukan</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.kod_rujukan)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Nama Peminjam</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.nama_peminjam)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Jumlah Tunggakan</td><td style="padding:6px 0;font-weight:600;color:#dc2626;">${esc(data.jumlah_tunggakan)}</td></tr>
       </table>`
    ),
  })
}

export function sendNewSusulanEmail(to: string, data: { kod_rujukan: string; nama_peminjam: string; tarikh_susulan: string }): Promise<void> {
  return sendEmail({
    to,
    subject: `[Traceo] Susulan Baharu Direkod — ${data.kod_rujukan}`,
    html: layout(
      'Susulan Baharu Disediakan',
      `<p>Rekod susulan baharu telah ditambah untuk fasiliti berikut:</p>
       <table style="width:100%;border-collapse:collapse;margin-top:8px;">
         <tr><td style="padding:6px 0;color:#475569;">Kod Rujukan</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.kod_rujukan)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Nama Peminjam</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.nama_peminjam)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Tarikh Susulan</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.tarikh_susulan)}</td></tr>
       </table>`
    ),
  })
}
export function sendApprovalEmail(to: string, data: { kod_rujukan: string; nama_peminjam: string; keputusan: string }): Promise<void> {
  const isApproved = data.keputusan === 'diluluskan'
  return sendEmail({
    to,
    subject: `[Traceo] Susulan ${isApproved ? 'Diluluskan' : 'Ditolak'} — ${data.kod_rujukan}`,
    html: layout(
      `Susulan ${isApproved ? 'Diluluskan' : 'Ditolak'}`,
      `<p>Status kelulusan untuk susulan fasiliti berikut telah dikemas kini:</p>
       <table style="width:100%;border-collapse:collapse;margin-top:8px;">
         <tr><td style="padding:6px 0;color:#475569;">Kod Rujukan</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.kod_rujukan)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Nama Peminjam</td><td style="padding:6px 0;font-weight:600;color:#0f172a;">${esc(data.nama_peminjam)}</td></tr>
         <tr><td style="padding:6px 0;color:#475569;">Keputusan</td><td style="padding:6px 0;font-weight:600;color:${isApproved ? '#16a34a' : '#dc2626'};">${isApproved ? 'Diluluskan (Approved)' : 'Ditolak (Rejected)'}</td></tr>
       </table>`
    ),
  })
}

// Fetch active admin / manager emails for operational notifications.
export async function getAdminEmails(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('emel')
    .in('peranan', ['admin', 'pengurus', 'superadmin'])
    .eq('status', 'aktif')
  return (data ?? [])
    .map((u) => u.emel as string)
    .filter((e): e is string => typeof e === 'string' && e.length > 0)
}
