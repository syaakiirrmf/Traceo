import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import type { SupabaseClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'Traceo <onboarding@resend.dev>'

// Gmail SMTP (Nodemailer) — jalan tanpa servis pihak ketiga, cuma perlu akaun
// Gmail + App Password (bukan kata laluan login biasa). Diutamakan bila
// dikonfigurasi; Resend jadi sandaran.
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const gmailConfigured = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD)
// GMAIL_TLS_INSECURE=1: longgarkan semakan sijil TLS. Hanya perlu bila antivirus
// di laptop buat imbasan TLS (dia menyelit di tengah dan sijil jadi tidak sah).
// Sertakan hanya di persekitaran yang kau kawal; jangan hidupkan di server awam.
const gmailTlsInsecure = process.env.GMAIL_TLS_INSECURE === '1'
const gmailTransporter = gmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER as string, pass: GMAIL_APP_PASSWORD as string },
      ...(gmailTlsInsecure ? { tls: { rejectUnauthorized: false } } : {}),
    })
  : null

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

// NOTIFY_EMAIL_OVERRIDE: hala semua notifikasi ke satu alamat (pengujian).
// Kosongkan untuk hantar ke emel akaun penerima sebenar (pengeluaran).
const NOTIFY_OVERRIDE = process.env.NOTIFY_EMAIL_OVERRIDE?.trim() || ''

// Dedupe: jangan hantar emel seiras (penerima + tajuk sama) lebih dari sekali
// dalam 60 saat. Kes biasa: 1 kes tertunggak mencetus 1 emel setiap admin
// (6 akaun = 6 emel); dengan lencongan ujian keenam-enam menuju ke satu inbox
// dan nampak seperti spam. Tanpa lencongan, penerima berbeza tidak terjejas.
const DEDUPE_WINDOW_MS = 60_000
const recentSends = new Map<string, number>()

function isDuplicateSend(to: string | string[], subject: string): boolean {
  const key = `${JSON.stringify(to)}|${subject}`
  const now = Date.now()
  if (recentSends.size > 500) {
    const cutoff = now - DEDUPE_WINDOW_MS
    for (const [k, t] of recentSends) {
      if (t < cutoff) recentSends.delete(k)
    }
  }
  const last = recentSends.get(key)
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return true
  recentSends.set(key, now)
  return false
}

export async function sendEmail({ to, subject, html }: SendInput): Promise<void> {
  const finalTo = NOTIFY_OVERRIDE || to
  if (NOTIFY_OVERRIDE) {
    console.info('[email] override penerima:', { asal: to, hantarKe: NOTIFY_OVERRIDE, subject })
  }
  if (isDuplicateSend(finalTo, subject)) {
    console.info('[email] salinan seiras dilangkau:', { to: finalTo, subject })
    return
  }

  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"Traceo" <${GMAIL_USER}>`,
        to: finalTo,
        subject,
        html,
      })
      return
    } catch (err) {
      console.error('[email] gmail send threw:', err instanceof Error ? err.message : err)
      return
    }
  }

  if (!resend) {
    console.info('[email] not configured, skipping:', { to: finalTo, subject })
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: finalTo,
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
