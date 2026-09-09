'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

/** Butang submit dengan state pending automatik (guna dalam <form action>). */
export function SubmitButton({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors shadow-[var(--shadow-sm)] disabled:opacity-60 min-h-[44px] ${className}`}
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending ? 'Menyimpan...' : children}
    </button>
  )
}
