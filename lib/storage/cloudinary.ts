import 'server-only'
import { v2 as cloudinary } from 'cloudinary'
import { MAX_FILES_PER_SUSULAN, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from './limits'

export { MAX_FILES_PER_SUSULAN }

// ─── Cloudinary Client ─────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Upload File ──────────────────────────────────────────────────────────────

interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

function uploadBuffer(
  buffer: Buffer,
  options: Record<string, unknown>
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error)
      else resolve(result as CloudinaryUploadResult)
    })
    stream.end(buffer)
  })
}

export async function uploadFile(
  file: File,
  prefix: string = 'lampiran'
): Promise<{ url: string; key: string } | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary tidak dikonfigurasi (CLOUDINARY_* env tiada). Hubungi admin.')
  }
  try {
    const publicId = `${prefix}/${Date.now()}-${crypto.randomUUID()}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadBuffer(buffer, {
      public_id: publicId,
      resource_type: 'auto',
      folder: '',
    })

    return { url: result.secure_url, key: result.public_id }
  } catch (err) {
    console.error('[Cloudinary Upload Error]', err)
    return null
  }
}

// ─── Delete File ──────────────────────────────────────────────────────────────

export async function deleteFile(keyOrUrl: string): Promise<void> {
  try {
    const { publicId, resourceType } = parsePublicId(keyOrUrl)

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error('[Cloudinary Delete Error]', err)
  }
}

function parsePublicId(keyOrUrl: string): {
  publicId: string
  resourceType: string
} {
  // Handle bare public_id (already clean)
  if (!keyOrUrl.startsWith('http')) {
    return { publicId: keyOrUrl, resourceType: 'image' }
  }

  const url = new URL(keyOrUrl)
  const parts = url.pathname.split('/')

  const uploadIdx = parts.findIndex((p) => p === 'upload')
  if (uploadIdx === -1) {
    // Not a Cloudinary URL — nothing to delete
    return { publicId: '', resourceType: 'image' }
  }

  const resourceType = parts[uploadIdx - 1] ?? 'image'

  let rest = parts.slice(uploadIdx + 1)
  if (rest[0]?.startsWith('v')) rest = rest.slice(1) // strip version segment

  const publicId = rest
    .join('/')
    .replace(/\.(jpe?g|png|gif|webp|svg|pdf|doc|docx|xlsx|txt|csv|mp4|mov)$/i, '')

  return { publicId, resourceType }
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

export function getFileType(file: File): 'imej' | 'dokumen' {
  return file.type.startsWith('image/') ? 'imej' : 'dokumen'
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_SIZE_BYTES = MAX_FILE_BYTES

export { MAX_TOTAL_BYTES }

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (isHeicFile(file)) {
    return {
      valid: false,
      error: `'${file.name}' ialah foto HEIC iPhone yang tidak disokong. Tukar ke JPG dahulu (Settings > Camera > Formats > Most Compatible) atau pilih 'Most Compatible' semasa berkongsi.`,
    }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `'${file.name}': jenis fail tidak disokong (${file.type || 'tidak diketahui'}). Hanya JPG, PNG, WebP, GIF, PDF, DOC/DOCX.` }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `'${file.name}': melebihi 10MB setiap fail.` }
  }
  if (file.size === 0) {
    return { valid: false, error: `'${file.name}': fail kosong.` }
  }
  return { valid: true }
}

/** HEIC dikesan via MIME atau ekstensi (iPhone hantar image/heic/heif). */
function isHeicFile(file: File): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  return /\.hei[cf]$/i.test(file.name)
}

/** Semak magic-byte supaya MIME client tidak boleh spoof. */
export async function verifyFileSignature(file: File): Promise<boolean> {
  try {
    const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const head = (n: number) => Array.from(buf.slice(0, n))
    const eq = (a: number[], b: number[]) => a.length >= b.length && b.every((v, i) => a[i] === v)
    const h = head(12)
    switch (file.type) {
      case 'image/jpeg':
        return eq(h, [0xff, 0xd8, 0xff])
      case 'image/png':
        return eq(h, [0x89, 0x50, 0x4e, 0x47])
      case 'image/gif':
        return eq(h, [0x47, 0x49, 0x46, 0x38])
      case 'image/webp':
        return eq(h.slice(0, 4), [0x52, 0x49, 0x46, 0x46]) && eq(h.slice(8, 12), [0x57, 0x45, 0x42, 0x50])
      case 'application/pdf':
        return eq(h, [0x25, 0x50, 0x44, 0x46])
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return eq(h, [0x50, 0x4b, 0x03, 0x04]) // zip
      case 'application/msword':
        return eq(h, [0xd0, 0xcf, 0x11, 0xe0]) || eq(h, [0x50, 0x4b, 0x03, 0x04])
      default:
        return false
    }
  } catch {
    return false
  }
}

/** Sanitasi nama fail sebelum simpan sebagai nama_asal (DB + paparan). */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'fail'
  return base.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 150) || 'fail'
}

export interface ValidatedBatch {
  valid: File[]
  errors: string[]
}

/** Validasi batch: had bilangan + jumlah saiz + jenis/saiz setiap fail. */
export function validateFileBatch(files: File[]): ValidatedBatch {
  const nonEmpty = files.filter((f) => f && f.size > 0)
  const errors: string[] = []
  if (nonEmpty.length > MAX_FILES_PER_SUSULAN) {
    return {
      valid: [],
      errors: [`Maksimum ${MAX_FILES_PER_SUSULAN} fail setiap susulan (diberi ${nonEmpty.length}).`],
    }
  }
  const total = nonEmpty.reduce((s, f) => s + f.size, 0)
  if (total > MAX_TOTAL_BYTES) {
    return { valid: [], errors: ['Jumlah saiz fail melebihi 50MB. Kurangkan bilangan atau saiz foto.'] }
  }
  const valid: File[] = []
  for (const f of nonEmpty) {
    const v = validateFile(f)
    if (v.valid) valid.push(f)
    else if (v.error) errors.push(v.error)
  }
  return { valid, errors }
}

/** Muat naik selari dengan had concurrency (ganti gelung sequential perlahan). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const workers = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return out
}
