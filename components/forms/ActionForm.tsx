'use client'

import { useActionState, useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export interface ActionFormState {
  error: string | null
}

export const initialActionState: ActionFormState = { error: null }

function isRedirectError(e: unknown): boolean {
  const digest = (e as { digest?: unknown })?.digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}

/**
 * Pembungkus <form> untuk server actions sedia ada (yang throw Error).
 * Ralat dipaparkan inline (bukan full-page error boundary); redirect
 * success dikekalkan (dilempar semula). Guna ganti <form action={...}>
 * dengan menukar tag + import sahaja.
 */
export function ActionForm({
  action,
  children,
  className = '',
}: {
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  className?: string
}) {
  const [state, formAction] = useActionState<ActionFormState, FormData>(
    async (_prev, fd) => {
      try {
        await action(fd)
        return initialActionState
      } catch (e) {
        if (isRedirectError(e)) throw e
        return { error: e instanceof Error ? e.message : 'Ralat tidak dijangka. Cuba lagi.' }
      }
    },
    initialActionState
  )

  const alertRef = useRef<HTMLParagraphElement>(null)
  const shownError = useRef<string | null>(null)

  // Ralat mesti mustahil terlepas: scroll ke mesej + toast, bukan inline senyap
  // di bawah lipatan sahaja.
  useEffect(() => {
    if (state.error && state.error !== shownError.current) {
      shownError.current = state.error
      toast.error('Gagal menyimpan', state.error)
      alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (!state.error) shownError.current = null
  }, [state.error])

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p
          ref={alertRef}
          role="alert"
          className="flex items-start gap-2 text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-[var(--radius-md)] px-3 py-2.5"
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </p>
      )}
    </form>
  )
}
