// Had lampiran — modul selamat-client (tiada server-only).
// Diimport oleh komponen client (preview) dan lib/storage/cloudinary (server).

export const MAX_FILES_PER_SUSULAN = 10
export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB setiap fail
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50MB total setiap susulan

export const LAMPIRAN_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx'
