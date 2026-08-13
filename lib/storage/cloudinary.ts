import { v2 as cloudinary } from 'cloudinary'

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

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Jenis fail tidak disokong: ${file.type}` }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `Saiz fail melebihi 10MB` }
  }
  return { valid: true }
}
