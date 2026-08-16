import { describe, expect, it } from 'vitest'
import { cleanAiResponse, detectStructuredRequest } from '@/lib/ai/postProcess'

describe('detectStructuredRequest', () => {
  it('detects report/summary keywords', () => {
    expect(detectStructuredRequest('Berikan saya laporan')).toBe(true)
    expect(detectStructuredRequest('senarai fasiliti')).toBe(true)
    expect(detectStructuredRequest('Buat analisis')).toBe(true)
    expect(detectStructuredRequest('portfolio summary')).toBe(true)
  })

  it('returns false for plain conversation', () => {
    expect(detectStructuredRequest('Apa itu fasiliti?')).toBe(false)
    expect(detectStructuredRequest('')).toBe(false)
  })
})

describe('cleanAiResponse', () => {
  it('strips generic openers', () => {
    const out = cleanAiResponse('Sebenarnya, JV-007 berada dalam status aktif.')
    expect(out.startsWith('JV-007')).toBe(true)
    expect(out.includes('Sebenarnya')).toBe(false)
  })

  it('uppercases facility codes', () => {
    const out = cleanAiResponse('kod jv-007 telah dikemas kini')
    expect(out).toContain('JV-007')
    expect(out).not.toContain('jv-007')
  })

  it('formats RM amounts with thousands separators', () => {
    const out = cleanAiResponse('nilai RM 54200.00 telah disemak')
    expect(out).toContain('RM54,200')
    expect(out).not.toContain('RM 54200.00')
  })

  it('removes bold from facility codes', () => {
    const out = cleanAiResponse('**JV-007** aktif')
    expect(out).not.toContain('**JV-007**')
    expect(out).toContain('JV-007')
  })

  it('strips closing template phrases', () => {
    const out = cleanAiResponse(
      'JV-007 berada dalam status aktif, Adakah anda ingin maklumat lanjut?'
    )
    expect(out).not.toContain('Adakah anda')
    expect(out).toContain('JV-007')
  })

  it('capitalizes first letter and trims', () => {
    const out = cleanAiResponse('  jv-007 adalah aktif  ')
    expect(out).toMatch(/^Jv-007|^JV-007/)
    expect(out.trim()).toBe(out)
  })

  it('returns empty string for empty input', () => {
    expect(cleanAiResponse('')).toBe('')
  })

  it('falls back to original text when cleaning removes everything', () => {
    const input = 'Sejujurnya'
    expect(cleanAiResponse(input)).toBe(input)
  })

  it('splits multiple facility codes jammed on one bullet line', () => {
    const input = '- JV-003 · Nama A · RM100, JV-007 · Nama B · RM200'
    const out = cleanAiResponse(input)
    const bulletLines = out.split('\n').filter((l) => l.startsWith('- '))
    expect(bulletLines).toHaveLength(2)
  })
})
