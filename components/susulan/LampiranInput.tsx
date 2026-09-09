'use client'

import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { MAX_FILES_PER_SUSULAN, MAX_FILE_BYTES, MAX_TOTAL_BYTES, LAMPIRAN_ACCEPT } from '@/lib/storage/limits'

const ACCEPT = LAMPIRAN_ACCEPT
const MAX_ONE = MAX_FILE_BYTES

interface Picked {
  file: File
  preview: string | null
}

function clientCheck(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_SUSULAN) {
    return `Maksimum ${MAX_FILES_PER_SUSULAN} fail (dipilih ${files.length}).`
  }
  const total = files.reduce((s, f) => s + f.size, 0)
  if (total > MAX_TOTAL_BYTES) return 'Jumlah saiz melebihi 50MB.'
  for (const f of files) {
    if (/\.hei[cf]$/i.test(f.name) || f.type === 'image/heic' || f.type === 'image/heif') {
      return `'${f.name}' HEIC tidak disokong — tukar ke JPG dahulu.`
    }
    if (f.size > MAX_ONE) return `'${f.name}' melebihi 10MB.`
  }
  return null
}

export function LampiranInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<Picked[]>([])
  const [error, setError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [savedBytes, setSavedBytes] = useState<number | null>(null)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const err = clientCheck(files)
    if (err) {
      setError(err)
      if (inputRef.current) inputRef.current.value = ''
      setPicked([])
      return
    }
    setError(null)
    setSavedBytes(null)

    // Mampatkan foto di peranti (jimat data lapangan + laju muat naik).
    // Dokumen (PDF/DOC) dikekalkan asal. Sasaran: ≤1920px, ≤1MB setiap foto.
    const needsCompress = files.some((f) => f.type.startsWith('image/') && f.type !== 'image/gif' && f.size > 1024 * 1024)
    let finalFiles = files
    if (needsCompress) {
      setCompressing(true)
      try {
        const before = files.reduce((s, f) => s + f.size, 0)
        finalFiles = await Promise.all(
          files.map(async (f) => {
            if (!f.type.startsWith('image/') || f.type === 'image/gif' || f.size <= 1024 * 1024) return f
            try {
              const blob = await imageCompression(f, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
              })
              return new File([blob], f.name, { type: 'image/jpeg', lastModified: Date.now() })
            } catch {
              return f // fallback: hantar asal jika compress gagal
            }
          })
        )
        setSavedBytes(before - finalFiles.reduce((s, f) => s + f.size, 0))
      } finally {
        setCompressing(false)
      }
      // Tulis semula input.files dengan fail termampat supaya submit hantar yang kecil.
      if (inputRef.current) {
        const dt = new DataTransfer()
        finalFiles.forEach((f) => dt.items.add(f))
        inputRef.current.files = dt.files
      }
    }
    // Bebaskan object URL lama
    picked.forEach((p) => p.preview && URL.revokeObjectURL(p.preview))
    setPicked(
      finalFiles.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }))
    )
  }

  function removeAt(idx: number) {
    const next = picked.filter((_, i) => i !== idx)
    const removed = picked[idx]
    if (removed?.preview) URL.revokeObjectURL(removed.preview)
    setPicked(next)
    // Sync input.files supaya submit tidak hantar fail yang dibuang
    if (inputRef.current) {
      const dt = new DataTransfer()
      next.forEach((p) => dt.items.add(p.file))
      inputRef.current.files = dt.files
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="lampiran"
        className="flex flex-col items-center justify-center gap-2 min-h-28 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-muted)] hover:bg-[var(--color-brand-subtle)] transition-colors cursor-pointer px-4 py-4"
      >
        <Upload size={20} className="text-[var(--color-text-tertiary)]" />
        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Klik untuk muat naik fail</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            JPG, PNG, WebP, GIF, PDF, DOC/DOCX · Maks {MAX_FILES_PER_SUSULAN} fail · 10MB setiap fail · 50MB total
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Foto HEIC iPhone tidak disokong — guna JPG
          </p>
        </div>
        <input
          id="lampiran"
          ref={inputRef}
          type="file"
          name="lampiran"
          multiple
          accept={ACCEPT}
          capture="environment"
          onChange={onChange}
          className="sr-only"
        />
      </label>

      {error && (
        <p className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </p>
      )}

      {compressing && (
        <p className="text-xs text-[var(--color-brand)] flex items-center gap-1.5">
          <Loader2 size={13} className="animate-spin" /> Memampatkan foto...
        </p>
      )}

      {savedBytes !== null && savedBytes > 0 && !compressing && (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Dimampatkan: jimat {(savedBytes / 1024 / 1024).toFixed(1)}MB sebelum muat naik.
        </p>
      )}

      {picked.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {picked.map((p, i) => (
            <li
              key={`${p.file.name}-${i}`}
              className="relative rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-2"
            >
              {p.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.preview} alt={p.file.name} className="h-20 w-full object-cover rounded" />
              ) : (
                <div className="h-20 w-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                  <FileText size={24} />
                </div>
              )}
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] truncate flex items-center gap-1">
                {p.file.type.startsWith('image/') ? <ImageIcon size={11} /> : <FileText size={11} />}
                {p.file.name}
              </p>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Buang ${p.file.name}`}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
