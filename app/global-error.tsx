'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('[Traceo Error]', error)
  }, [error])

  return (
    <html lang="ms">
      <body className="min-h-screen flex items-center justify-center bg-[oklch(0.98_0.005_240)]">
        <div className="text-center max-w-sm px-4">
          <div className="w-12 h-12 rounded-xl bg-[oklch(0.95_0.04_25)] flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h1 className="text-lg font-semibold text-[oklch(0.15_0.02_240)] mb-2">
            Ralat tidak dijangka
          </h1>
          <p className="text-sm text-[oklch(0.45_0.015_240)] mb-6">
            {error.message || 'Sesuatu telah berlaku. Sila cuba lagi.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-[10px] bg-[oklch(0.45_0.16_255)] text-white text-sm font-medium hover:bg-[oklch(0.40_0.18_255)] transition-colors"
            >
              Cuba lagi
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-[10px] border border-[oklch(0.88_0.01_240)] text-sm text-[oklch(0.45_0.015_240)] hover:bg-[oklch(0.95_0.005_240)] transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
