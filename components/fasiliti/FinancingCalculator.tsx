'use client'

import { useMemo, useState } from 'react'
import { Calculator, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'

interface FinancingCalculatorProps {
  jumlahPembiayaan: number
  kadarDividen?: string | null
  kategori: string
}

export function FinancingCalculator({
  jumlahPembiayaan,
  kadarDividen,
  kategori,
}: FinancingCalculatorProps) {
  const [open, setOpen] = useState(false)
  const [financing, setFinancing] = useState(jumlahPembiayaan || 0)
  const [rate, setRate] = useState(0)
  const [period, setPeriod] = useState(12)
  const [compound, setCompound] = useState(false)

  const isJV = kategori === 'jv_syarikat' || kategori === 'jv_tanah'

  const parsedRate = useMemo(() => {
    if (rate > 0) return rate
    if (!kadarDividen) return 0
    const match = kadarDividen.match(/(\d+(?:\.\d+)?)\s*%/i)
    return match ? Number(match[1]) : 0
  }, [rate, kadarDividen])

  const results = useMemo(() => {
    const principal = Math.max(financing, 0)
    const annualRate = parsedRate / 100
    const months = Math.max(period, 1)

    const yearFraction = months / 12
    const annual = principal * annualRate
    const simple = principal * annualRate * yearFraction
    const total = compound
      ? principal * Math.pow(1 + annualRate / 12, months)
      : principal + simple

    return {
      annualProfit: annual,
      periodProfit: total - principal,
      total,
      effectiveAnnual: principal > 0 ? (total - principal) / principal / yearFraction : 0,
    }
  }, [financing, parsedRate, period, compound])

  const presetRates = isJV ? [5, 6, 7, 8] : [3, 4, 5, 6]

  function resetToDefaults() {
    setFinancing(jumlahPembiayaan || 0)
    const match = kadarDividen?.match(/(\d+(?:\.\d+)?)\s*%/i)
    setRate(match ? Number(match[1]) : 0)
    setPeriod(12)
    setCompound(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        <Calculator size={14} />
        Calculator
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={<Calculator size={18} />}
        title={
          isJV
            ? 'Profit / Dividend Calculator'
            : 'Financing Repayment Calculator'
        }
        description="Estimate expected profit, dividend or repayment based on the capital financing amount."
        maxWidth="max-w-lg"
        ariaLabel="Financing calculator"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1 block">
                Capital Financing (RM)
              </span>
              <input
                type="number"
                min={0}
                value={Number.isFinite(financing) ? financing : 0}
                onChange={(e) => setFinancing(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1 block">
                Rate (% / year)
              </span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={Number.isFinite(parsedRate) ? parsedRate : 0}
                  onChange={(e) => setRate(Number(e.target.value))}
                  placeholder={kadarDividen ?? 'e.g. 6'}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                />
              </div>
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-[var(--color-text-tertiary)] self-center mr-1">
              Quick rates:
            </span>
            {presetRates.map((r) => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  parsedRate === r
                    ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1 block">
                Period (months)
              </span>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              >
                {[3, 6, 9, 12, 24, 36, 48, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-end gap-2 pb-1.5">
              <input
                type="checkbox"
                checked={compound}
                onChange={(e) => setCompound(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-brand)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Compound monthly
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
                Annual profit
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                {formatCurrency(results.annualProfit)}
              </p>
            </div>
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
                Period profit
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--color-brand)]">
                {formatCurrency(results.periodProfit)}
              </p>
            </div>
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-0.5">
                Total projected
              </p>
              <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                {formatCurrency(results.total)}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
            Estimates are indicative only — actual amounts depend on the agreed profit-sharing
            structure, payment schedule and official rates recorded on the facility.
          </p>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={resetToDefaults}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} />
            Reset
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    </>
  )
}