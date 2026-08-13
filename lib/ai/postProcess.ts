/**
 * Helper to detect if the user's prompt explicitly requests structured/report outputs.
 */
export function detectStructuredRequest(userMessage: string): boolean {
  if (!userMessage) return false
  const pattern =
    /\b(laporan|breakdown|senarai|senarai lengkap|ikut kategori|jadual|ringkasan|portfolio|analisis|report|list|category|table|summary|overview)\b/i
  return pattern.test(userMessage)
}

/**
 * Clean AI responses from slop, enforce RM formatting, unbold facility codes,
 * normalize mid-sentence dashes, strip generic openers/closers, and handle structured headings.
 */
export function cleanAiResponse(text: string, isStructuredRequest: boolean = false): string {
  if (!text) return ''
  let cleaned = text

  // 1. Buang frasa pembuka generic / slop di awal jawapan (case-insensitive)
  const genericOpeners = [
    /^(Sebenarnya|Jujurnya|Sejujurnya|Pada hakikatnya)[,:]?\s*/i,
    /^Berdasarkan data (yang diperolehi|di atas|semasa)[,:]?\s*/i,
    /^Berikut adalah (analisis|ringkasan|senarai)[^:]*:?\s*/i,
    /^Untuk menjawab soalan (anda|awak)[,:]?\s*/i,
    /^Based on (the |our )?(data|records)( obtained| above| current| we have)?[,:]?\s*/i,
    /^Here (is|are) (an? )?(analysis|summary|list|overview)[^:]*:?\s*/i,
    /^To (answer|address|respond to) your (question|request|query)[,:]?\s*/i,
    /^Actually[,:]?\s*/i,
  ]
  for (const pattern of genericOpeners) {
    cleaned = cleaned.replace(pattern, '')
  }

  // 1b. Buang baris "Berikut adalah senarai ..." walau di tengah-tengah teks
  cleaned = cleaned.replace(/[ \t]*[Bb]erikut adalah senarai[^:\n]*:?\s*\n/g, '\n')

  // 1c. Safety net: pecahkan bullet line yang (walaupun dah diinstruct elak) masih
  //     gabungkan LEBIH DARI SATU fasiliti dalam SATU baris "- " dipisah koma.
  //     Contoh: "- JV-003 · Nama · RM100, JV-007 · Nama2 · RM200" akan dipecah
  //     jadi dua baris "- " berasingan. Kod fasiliti dikesan guna pattern umum
  //     seperti JV-003, PL-301, JVT-2016 (2-4 huruf + sengkang + 2-5 digit).
  const FASILITI_CODE_RE = /[A-Z]{2,4}-\d{2,5}/
  cleaned = cleaned.replace(/^-\s+(.+)$/gm, (line, content: string) => {
    // Pecahkan pada koma yang diikuti oleh kod fasiliti baharu (bukan koma dalam nombor RM)
    const parts = content
      .split(new RegExp(`,\\s+(?=${FASILITI_CODE_RE.source}\\s*·)`))
      .map((p: string) => p.trim())
      .filter(Boolean)
    if (parts.length > 1) {
      return parts.map((p: string) => `- ${p}`).join('\n')
    }
    return line
  })

  // 2. Dash Normalization (sengkang TENGAH AYAT " - " atau " — " tukar ke koma).
  //    PENTING: guna [ \t] (bukan \s) supaya TIDAK merentasi newline — ini elak
  //    regex ni "makan" bullet list markdown ("- item" di awal baris baharu),
  //    sebab \s dalam JS regex turut match \n, yang boleh gabungkan baris bullet
  //    jadi satu ayat panjang bersambung koma (bug yang pernah jadi sebelum ni).
  //    Dengan [ \t] sahaja, cuma dash yang benar-benar berada DALAM satu baris
  //    yang sama (bukan bullet marker di permulaan baris baharu) akan kena normalize.
  cleaned = cleaned.replace(/(\S)[ \t]+-[ \t]+(\S)/g, '$1, $2')
  cleaned = cleaned.replace(/(\S)[ \t]*—[ \t]*(\S)/g, '$1, $2')

  // 3. Bold pada Kod Fasiliti (KOD/NAMA FASILITI TIDAK BOLEH BOLD: **JV-007** -> JV-007)
  cleaned = cleaned.replace(/\*\*\b([A-Z]{2,3}-\d{3,})\b\*\*/gi, '$1')

  // 4. Uppercase Kod Fasiliti (contoh jv-007 -> JV-007, pi-001 -> PI-001)
  cleaned = cleaned.replace(
    /\b(jv|pi)-(\d{3,})\b/gi,
    (_, prefix, num) => `${prefix.toUpperCase()}-${num}`
  )

  // 5. Enforce RM formatting & peratus pada code level
  //    Contoh: "RM 54200.00" / "RM54200.00" -> "RM54,200"
  cleaned = cleaned.replace(/\bRM\s*([\d,]+)(?:\.(\d{2}))?\b/gi, (_, amountStr, decimals) => {
    const rawNum = parseFloat(amountStr.replace(/,/g, ''))
    if (isNaN(rawNum)) return `RM${amountStr}`

    const formattedInt = new Intl.NumberFormat('ms-MY').format(Math.floor(rawNum))
    if (decimals && decimals !== '00') {
      return `RM${formattedInt}.${decimals}`
    }
    return `RM${formattedInt}`
  })

  // 6. Buang frasa penutup template, soalan template & ayat penutup pasif
  const closingPatterns = [
    /[,;]?\s*(Adakah anda (ingin|mahu|nak)[^.!?\n]*\??)\s*$/i,
    /[,;]?\s*(Sila (beritahu|maklumkan) jika[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Semoga (maklumat|bantuan)[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Terima kasih kerana[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Jangan ragu[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Kesemua akaun ini memerlukan semakan segera[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Let me know if[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Hope this helps[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Do you want me to[^.!?\n]*\??)\s*$/i,
  ]
  for (const pattern of closingPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // 6b. Buang kata defensif orphan (Sebenarnya/Jujurnya/Sejujurnya) di hujung ayat
  cleaned = cleaned.replace(/\s+(Sebenarnya|Sejujurnya|Jujurnya|Pada hakikatnya)[.,]?\s*$/i, '')

  // 7. Handling Heading Markdown:
  //    Jika BUKAN isStructuredRequest, buang markdown headings (##, ###) untuk elak jawapan pendek ada tajuk pelik
  if (!isStructuredRequest) {
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
  }

  // 8. Trim whitespace berlebihan
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  // 9. Pastikan huruf pertama capital selepas cleaning
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  // Fallback jika semua kandungan terpadam
  if (!cleaned) return text.trim()

  return cleaned
}
