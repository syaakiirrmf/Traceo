'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard, ArrowLeft } from 'lucide-react'
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
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl text-center overflow-hidden">
        {/* Subtle accent glow backdrop */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />

        {/* Warning Icon with double ring pulse */}
        <div className="relative w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 animate-ping opacity-75" />
          <AlertTriangle className="w-8 h-8 text-red-600 relative z-10" />
        </div>

        {/* Category tag */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80 mb-3">
          Ralat Sistem &bull; System Notice
        </span>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Gagal Memuatkan Halaman
        </h1>

        {/* Error message */}
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl font-mono text-left break-words max-h-32 overflow-y-auto">
          {error.message || 'Ralat yang tidak dijangka telah berlaku semasa memproses permintaan anda.'}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-semibold hover:bg-teal-800 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCw size={15} className="animate-spin-once" />
            Cuba Semula (Retry)
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 shadow-2xs active:scale-95"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </div>

        {/* Error digest info footer */}
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 mt-6 pt-4 border-t border-slate-100">
            Digest ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
