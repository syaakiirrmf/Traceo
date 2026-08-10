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
      <body className="min-h-screen flex items-center justify-center bg-[#0d1a14] text-white font-sans relative overflow-hidden">
        {/* Ambient radial glow background */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, rgba(15,118,110,0.05) 50%, transparent 75%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative z-10 text-center max-w-md px-6 py-10 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl">
          {/* Warning Icon container */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 text-teal-300 border border-white/10 mb-3">
            Ralat Global &bull; Critical System Error
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Ralat Luar Jangkaan
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed bg-black/30 border border-white/10 p-3.5 rounded-xl font-mono text-left break-words">
            {error.message || 'Sistem menghadapi masalah kritikal semasa memproses permintaan anda.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-teal-500/20 active:scale-95 cursor-pointer"
            >
              Cuba Semula (Retry)
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 text-center"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
