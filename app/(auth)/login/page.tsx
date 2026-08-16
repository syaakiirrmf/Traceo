'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoBrand } from '@/components/ui/logo-brand'

export default function LoginPage() {
  const router = useRouter()

  const [emel, setEmel] = useState('')
  const [kataLaluan, setKataLaluan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emel, password: kataLaluan }),
      })

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: 'Invalid email or password. Please try again.' }))
        setError(data.error ?? 'Invalid email or password. Please try again.')
        setLoading(false)
        return
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-[380px] space-y-8">
      {/* Mobile logo */}
      <div className="lg:hidden">
        <LogoBrand size="md" variant="default" />
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-fustat font-black tracking-tight text-slate-900">Sign in</h2>
        <p className="text-sm text-slate-500 font-dm">Enter your credentials to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 font-dm">
        <div className="space-y-1.5">
          <label
            htmlFor="emel"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Email Address
          </label>
          <input
            id="emel"
            type="email"
            autoComplete="email"
            required
            value={emel}
            onChange={(e) => setEmel(e.target.value)}
            placeholder="name@company.com"
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 disabled:opacity-50"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="kata-laluan"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Password
          </label>
          <input
            id="kata-laluan"
            type="password"
            autoComplete="current-password"
            required
            value={kataLaluan}
            onChange={(e) => setKataLaluan(e.target.value)}
            placeholder="••••••••"
            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 disabled:opacity-50"
            disabled={loading}
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-3 text-sm text-red-600 font-medium"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="flex-shrink-0 mt-[1px]"
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M8 5v3.5M8 11h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[#0066FF] text-white text-sm font-bold tracking-wide transition-all duration-150 hover:bg-[#0048CC] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[inset_0px_2px_3px_rgba(255,255,255,0.22),0_4px_16px_rgba(0,102,255,0.25)] font-fustat"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                />
                <path
                  d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Help text */}
      <p className="text-xs text-[var(--color-text-tertiary)] text-center">
        Don&apos;t have an account? Contact an Administrator for access.
      </p>
    </div>
  )
}
