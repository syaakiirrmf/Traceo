import { describe, expect, it } from 'vitest'
import {
  validateFile,
  validateFileBatch,
  verifyFileSignature,
  sanitizeFileName,
  mapLimit,
} from '@/lib/storage/cloudinary'

function makeFile(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('validateFile', () => {
  it('accepts a valid jpeg', () => {
    const f = makeFile([0xff, 0xd8, 0xff, 0x00], 'foto.jpg', 'image/jpeg')
    Object.defineProperty(f, 'size', { value: 100 })
    expect(validateFile(f).valid).toBe(true)
  })
  it('rejects HEIC with helpful message', () => {
    const f = makeFile([0x00], 'IMG_001.HEIC', 'image/heic')
    Object.defineProperty(f, 'size', { value: 100 })
    const r = validateFile(f)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/HEIC/)
  })
  it('rejects oversize files', () => {
    const f = makeFile([0xff, 0xd8, 0xff], 'big.jpg', 'image/jpeg')
    Object.defineProperty(f, 'size', { value: 11 * 1024 * 1024 })
    expect(validateFile(f).valid).toBe(false)
  })
})

describe('validateFileBatch', () => {
  it('rejects more than 10 files', () => {
    const files = Array.from({ length: 11 }, (_, i) => {
      const f = makeFile([0x01], `f${i}.jpg`, 'image/jpeg')
      Object.defineProperty(f, 'size', { value: 10 })
      return f
    })
    const r = validateFileBatch(files)
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.valid).toHaveLength(0)
  })
})

describe('verifyFileSignature', () => {
  it('accepts real png bytes', async () => {
    const f = makeFile(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'a.png',
      'image/png'
    )
    await expect(verifyFileSignature(f)).resolves.toBe(true)
  })
  it('rejects spoofed png (text content)', async () => {
    const bytes = Array.from(Buffer.from('hello world!'))
    const f = makeFile(bytes, 'evil.png', 'image/png')
    await expect(verifyFileSignature(f)).resolves.toBe(false)
  })
})

describe('sanitizeFileName', () => {
  it('strips paths and trims length', () => {
    expect(sanitizeFileName('C:\\fakepath\\foto.jpg')).toBe('foto.jpg')
    expect(sanitizeFileName('a'.repeat(200))).toHaveLength(150)
  })
})

describe('mapLimit', () => {
  it('preserves order with concurrency', async () => {
    const out = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => n * 2)
    expect(out).toEqual([2, 4, 6, 8, 10])
  })
})
