import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center max-w-sm px-4">
        <p className="text-6xl font-bold text-[var(--color-brand)] tabular-nums mb-4">404</p>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
