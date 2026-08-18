/**
 * Helper to detect if the user's prompt explicitly requests structured/report outputs.
 */
export function detectStructuredRequest(userMessage: string): boolean {
  if (!userMessage) return false
  const pattern =
    /\b(laporan|breakdown|senarai|senarai lengkap|ikut kategori|jadual|ringkasan|portfolio|analisis|report|list|category|table|summary|overview|analysis|by category|full list)\b/i
  return pattern.test(userMessage)
}

/**
 * Clean AI responses from slop, enforce RM formatting, unbold facility codes,
 * normalize mid-sentence dashes, strip generic openers/closers, and handle structured headings.
 */
export function cleanAiResponse(text: string, isStructuredRequest: boolean = false): string {
  if (!text) return ''
  let cleaned = text

  // 1. Remove generic/slop opening phrases at the start of the answer (case-insensitive)
  const genericOpeners = [
    /^(Sebenarnya|Jujurnya|Sejujurnya|Pada hakikatnya)[,:]?\s*/i,
    /^Berdasarkan data (yang diperolehi|di atas|semasa)[,:]?\s*/i,
    /^Berikut adalah (analisis|ringkasan|senarai)[^:]*:?\s*/i,
    /^Untuk menjawab soalan (anda|awak)[,:]?\s*/i,
    /^Based on (the |our )?(data|records)( obtained| above| current| we have)?[,:]?\s*/i,
    /^Here (is|are) (an? )?(analysis|summary|list|overview)[^:]*:?\s*/i,
    /^To (answer|address|respond to) your (question|request|query)[,:]?\s*/i,
    /^Actually[,:]?\s*/i,
    /^(To be honest|Honestly|In reality)[,:]?\s*/i,
  ]
  for (const pattern of genericOpeners) {
    cleaned = cleaned.replace(pattern, '')
  }

  // 1b. Remove "Berikut adalah senarai ..." lines even in the middle of the text
  cleaned = cleaned.replace(/[ \t]*[Bb]erikut adalah senarai[^:\n]*:?\s*\n/g, '\n')

  // 1c. Safety net: split bullet lines that (even though instructed to avoid) still
  //     combine MORE THAN ONE facility in a SINGLE "- " line separated by commas.
  //     Example: "- JV-003 · Name · RM100, JV-007 · Name2 · RM200" will be split
  //     into two separate "- " lines. Facility codes are detected with a general pattern
  //     like JV-003, PL-301, JVT-2016 (2-4 letters + dash + 2-5 digits).
  const FASILITI_CODE_RE = /[A-Z]{2,4}-\d{2,5}/
  cleaned = cleaned.replace(/^-\s+(.+)$/gm, (line, content: string) => {
    // Split on commas followed by a new facility code (not commas inside RM numbers)
    const parts = content
      .split(new RegExp(`,\\s+(?=${FASILITI_CODE_RE.source}\\s*·)`))
      .map((p: string) => p.trim())
      .filter(Boolean)
    if (parts.length > 1) {
      return parts.map((p: string) => `- ${p}`).join('\n')
    }
    return line
  })

  // 2. Dash Normalization (MID-SENTENCE dashes " - " or " — " turned into commas).
  //    IMPORTANT: use [ \t] (not \s) so it does NOT cross newlines — this prevents
  //    the regex from "eating" markdown bullet lists ("- item" at the start of a new line),
  //    because \s in JS regex also matches \n, which could join bullet lines
  //    into one long comma-connected sentence (a bug that happened before).
  //    With [ \t] only, only dashes truly WITHIN the same single line
  //    (not bullet markers at the start of a new line) get normalized.
  cleaned = cleaned.replace(/(\S)[ \t]+-[ \t]+(\S)/g, '$1, $2')
  cleaned = cleaned.replace(/(\S)[ \t]*—[ \t]*(\S)/g, '$1, $2')

  // 3. Bold on Facility Codes (FACILITY CODES/NAMES MUST NOT BE BOLD: **JV-007** -> JV-007)
  cleaned = cleaned.replace(/\*\*\b([A-Z]{2,3}-\d{3,})\b\*\*/gi, '$1')

  // 4. Uppercase Facility Codes (e.g. jv-007 -> JV-007, pi-001 -> PI-001)
  cleaned = cleaned.replace(
    /\b(jv|pi)-(\d{3,})\b/gi,
    (_, prefix, num) => `${prefix.toUpperCase()}-${num}`
  )

  // 5. Enforce RM formatting & percentages at the code level
  //    Example: "RM 54200.00" / "RM54200.00" -> "RM54,200"
  cleaned = cleaned.replace(/\bRM\s*([\d,]+)(?:\.(\d{2}))?\b/gi, (_, amountStr, decimals) => {
    const rawNum = parseFloat(amountStr.replace(/,/g, ''))
    if (isNaN(rawNum)) return `RM${amountStr}`

    const formattedInt = new Intl.NumberFormat('ms-MY').format(Math.floor(rawNum))
    if (decimals && decimals !== '00') {
      return `RM${formattedInt}.${decimals}`
    }
    return `RM${formattedInt}`
  })

  // 6. Remove template closing phrases, template questions & passive closing sentences
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
    /[,;]?\s*(Would you like( me)? to[^.!?\n]*\??)\s*$/i,
    /[,;]?\s*(Please (let me know|tell me) if[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Hope (this|the) (information|help)[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Thank you for[^.!?\n]*[.!?]?)\s*$/i,
    /[,;]?\s*(Don't hesitate|Feel free)[^.!?\n]*[.!?]?\s*$/i,
    /[,;]?\s*(All these accounts require[^.!?\n]*[.!?]?)\s*$/i,
  ]
  for (const pattern of closingPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // 6b. Remove orphaned defensive words (Sebenarnya/Jujurnya/Sejujurnya) at the end of a sentence
  cleaned = cleaned.replace(
    /\s+(Sebenarnya|Sejujurnya|Jujurnya|Pada hakikatnya|Actually|To be honest|Honestly|In reality)[.,]?\s*$/i,
    ''
  )

  // 7. Handling Heading Markdown:
  //    If NOT isStructuredRequest, remove markdown headings (##, ###) to prevent short answers from having odd headings
  if (!isStructuredRequest) {
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
  }

  // 8. Trim excess whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  // 9. Ensure the first letter is capitalized after cleaning
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  // Fallback if all content was removed
  if (!cleaned) return text.trim()

  return cleaned
}
