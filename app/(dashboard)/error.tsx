'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-[var(--color-surface)] border border-[var(--color-danger)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-danger-subtle)] flex items-center justify-center mx-auto mb-4 text-[var(--color-danger)]">
        <AlertCircle size={24} />
      </div>

      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        An Error Occurred
      </h2>

      <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
      </div>
    </div>
  )
}
