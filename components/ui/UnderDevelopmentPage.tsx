'use client'

import React from 'react'
import Link from 'next/link'
import { Hammer, Sparkles, ArrowLeft, ShieldAlert, Lock, Compass } from 'lucide-react'

interface UnderDevelopmentPageProps {
  title?: string
  featureName?: string
  description?: string
  minimal?: boolean
}

export function UnderDevelopmentPage({
  title = 'Module Under Development',
  featureName,
  description = 'This feature or page is being upgraded and is not yet available for your account access. Please contact the Superadmin for more information.',
  minimal = false,
}: UnderDevelopmentPageProps) {
  if (minimal) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-transparent p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Hammer size={22} className="animate-pulse" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100 font-fustat">
          {featureName ? `Feature "${featureName}" Not Yet Available` : title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {description}
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[520px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/60 p-8 text-center shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 font-dm">
      {/* Background ambient gradient glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-[#0066FF]/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <Hammer size={13} />
        <span>Exclusive Development Phase</span>
      </div>

      {/* Main Icon */}
      <div className="relative mt-6 mb-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#60B1FF] text-white shadow-lg shadow-[#0066FF]/25">
          <Lock size={36} />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
          <Sparkles size={14} />
        </div>
      </div>

      {/* Content */}
      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white font-fustat sm:text-3xl">
        {featureName ? `Module ${featureName}` : title}
      </h2>
      <p className="mt-2.5 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>

      {/* Status meta box */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldAlert size={14} className="text-[#0066FF]" />
          Access Status: <strong className="text-slate-800 dark:text-slate-200">Restricted (Role Policy)</strong>
        </span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <span className="flex items-center gap-1.5 font-medium">
          <Compass size={14} className="text-amber-500" />
          Version: <strong>Beta / Staging Tier</strong>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-fustat">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#0048CC] hover:shadow-lg hover:shadow-[#0066FF]/20 active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard/fasiliti"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95"
        >
          View Facilities
        </Link>
      </div>
    </div>
  )
}
