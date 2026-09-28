import { describe, expect, it, vi, beforeEach } from 'vitest'
import { sendEmail } from '@/lib/email'

describe('sendEmail dedupe', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('skips an identical resend within 60 seconds', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const args = { to: 'a@example.com', subject: 'Subjek Sama', html: '<p>x</p>' }
    await sendEmail(args)
    await sendEmail(args)
    const skipped = info.mock.calls.filter((c) =>
      String(c[0]).includes('salinan seiras dilangkau')
    )
    expect(skipped).toHaveLength(1)
  })

  it('sends distinct subjects normally', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await sendEmail({ to: 'a@example.com', subject: 'Satu', html: '<p>x</p>' })
    await sendEmail({ to: 'a@example.com', subject: 'Dua', html: '<p>x</p>' })
    const skipped = info.mock.calls.filter((c) =>
      String(c[0]).includes('salinan seiras dilangkau')
    )
    expect(skipped).toHaveLength(0)
  })
})
