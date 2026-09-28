// KadarDividen — kemaskan teks profit-sharing bebas (dari Excel) jadi senarai kemas.
// Corak disokong setiap baris:
//   "JUNE 2026 : 5200"      -> label kiri, amaun kanan
//   "AZRIN - 3,375/BULAN"   -> label kiri, amaun kanan (+ tempoh)
//   "10,000/BULAN"          -> amaun kanan (+ tempoh)
//   "15,600" (baris akhir)  -> jumlah keseluruhan (bold, bergaris atas)
//   teks lain               -> baris biasa
// Kalau tiada baris jadual langsung, papar teks asal (whitespace-pre-line).

function parseAmount(raw: string): number | null {
  const m = raw.replace(/RM/gi, '').trim().match(/^([\d,]+(?:\.\d+)?)$/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function formatScheduleAmount(n: number): string {
  return n.toLocaleString('ms-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

interface ScheduleRow {
  label: string | null
  tempoh: string | null
  amount: number | null
  plain: string | null
  total?: boolean
}

export function parseKadarDividen(value: string): ScheduleRow[] {
  const lines = value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const rows: ScheduleRow[] = []

  lines.forEach((line, idx) => {
    // 1) "LABEL : amount"  (cth: JUNE 2026 : 5200)
    const colon = line.match(/^(.*?)\s*:\s*(RM\s?)?([\d,]+(?:\.\d+)?)\s*$/)
    if (colon && colon[1].trim()) {
      rows.push({ label: colon[1].trim(), tempoh: null, amount: parseAmount(colon[3]), plain: null })
      return
    }
    // 2) "[label -] amount/TEMPOH"  (cth: 10,000/BULAN · AZRIN - 3,375/BULAN)
    const rate = line.match(/^(.*?)\s*(?:[-–]\s*)?(RM\s?)?([\d,]+(?:\.\d+)?)\s*\/\s*(.+)$/)
    if (rate) {
      const label = rate[1].trim() || null
      rows.push({ label, tempoh: rate[4].trim(), amount: parseAmount(rate[3]), plain: null })
      return
    }
    // 3) nombor tunggal di baris akhir selepas baris jadual -> jumlah
    const n = parseAmount(line)
    const hasSchedule = rows.some((r) => r.amount !== null)
    if (n !== null && hasSchedule && idx === lines.length - 1) {
      rows.push({ label: 'Jumlah', tempoh: null, amount: n, plain: null, total: true })
      return
    }
    // 4) teks biasa
    rows.push({ label: null, tempoh: null, amount: null, plain: line })
  })
  return rows
}

export function KadarDividen({
  value,
  compact,
}: {
  value: string | null | undefined
  compact?: boolean
}) {
  if (!value || !value.trim()) return null
  const rows = parseKadarDividen(value)
  const hasSchedule = rows.some((r) => r.amount !== null)

  if (!hasSchedule) {
    return (
      <span className="whitespace-pre-line leading-relaxed break-words">{value.trim()}</span>
    )
  }

  return (
    <span className={`block min-w-0 ${compact ? 'space-y-0.5' : 'space-y-1'}`}>
      {rows.map((r, i) =>
        r.amount !== null ? (
          <span
            key={i}
            className={`flex items-baseline justify-between gap-3 ${
              r.total ? 'border-t border-[var(--color-border)] pt-1 mt-1 font-bold' : ''
            }`}
          >
            <span className="text-[var(--color-text-secondary)] truncate">
              {r.label ?? r.tempoh ?? '—'}
              {r.label && r.tempoh && (
                <span className="text-[var(--color-text-tertiary)]"> /{r.tempoh}</span>
              )}
            </span>
            <span className="font-mono font-semibold tabular-nums text-[var(--color-text-primary)] whitespace-nowrap">
              RM {formatScheduleAmount(r.amount)}
            </span>
          </span>
        ) : (
          <span key={i} className="block text-[var(--color-text-secondary)] break-words">
            {r.plain}
          </span>
        )
      )}
    </span>
  )
}
