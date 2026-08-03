/**
 * Bersihkan jawapan AI dari pattern "AI slop" yang lepas dari system instruction.
 */
export function cleanAiResponse(text: string): string {
  let cleaned = text

  // 1. Ganti " - " (dash dikelilingi spasi, tengah ayat) dengan koma
  //    Elak kena julat nombor/tarikh (10-12, 1-15) sebab tiada spasi kat situ
  cleaned = cleaned.replace(/\s+-\s+/g, ', ')

  // 2. Ganti em-dash (—) yang sama tujuan
  cleaned = cleaned.replace(/\s*—\s*/g, ', ')

  // 3. Buang bullet list guna "-" di awal baris (tukar jadi "•")
  //    Ini untuk kes bila dash memang sengaja jadi bullet, standardize je style dia
  cleaned = cleaned.replace(/^-\s+/gm, '• ')

  // 4. Buang koma berturut-turut yang mungkin terhasil dari replace di atas
  //    (contoh: "A, , B" jadi "A, B")
  cleaned = cleaned.replace(/,\s*,/g, ',')

  // 5. Buang heading markdown (##, ###) kalau ada — safety net tambahan
  //    kalau model masih generate heading walau dah instructed jangan
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

  // 6. Buang semua marker bold/italic markdown (model overuse sangat)
  //    Prompt dah hadkan 1-2 bold je, tapi kalau masih lepas, buang semua
  cleaned = cleaned.replace(/\*\*/g, '').replace(/__(.*?)__/g, '$1')

  // 7. Buang frasa pembuka generic yang common (case-insensitive)
  const genericOpeners = [
    /^Berdasarkan data (yang diperolehi|di atas|semasa)[,:]?\s*/i,
    /^Berikut adalah (analisis|ringkasan|senarai)[^:]*:?\s*/i,
    /^Untuk menjawab soalan (anda|awak)[,:]?\s*/i,
    /^Sebenarnya[,:]?\s*/i,
  ]
  for (const pattern of genericOpeners) {
    cleaned = cleaned.replace(pattern, '')
  }

  // 7b. Buang baris "Berikut adalah senarai ..." (announcement sebelum bullet)
  //     walau di tengah-tengah teks — model selalu generate ni sebelum senarai
  cleaned = cleaned.replace(/[ \t]*[Bb]erikut adalah senarai[^:\n]*:?\s*\n/g, '\n')

  // 8. Buang frasa penutup template yang common di hujung jawapan
  //    TAPI: stop sebelum markdown link — jangan makan pautan muat turun
  cleaned = cleaned.replace(
    /[,;]?\s*(Semoga|Terima kasih kerana|Jangan ragu)[^.!?\[\]]*[.!?]?\s*$/i,
    ''
  )

  // 8b. Buang kata defensif orphan (Sebenarnya/Jujurnya) yang tersisa di hujung
  //     selepas frasa penutup dibuang
  cleaned = cleaned.replace(/\s+(Sebenarnya|Sejujurnya|Jujurnya)[.,]?\s*$/i, '')

  // 9. Trim whitespace berlebihan yang mungkin tertinggal
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  // 10. Buang koma/semicolon/titik tersasar di hujung (sisa dari replace dash)
  cleaned = cleaned.replace(/[,;]\s*$/, '')
  cleaned = cleaned.replace(/\s+([.!?])$/, '$1')

  // Pastikan huruf pertama capital lepas semua cleaning
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  // Kalau semua content tertanggal (reply cuma frasa penutup), kembalikan teks asal
  if (!cleaned) return text.trim()

  return cleaned
}
