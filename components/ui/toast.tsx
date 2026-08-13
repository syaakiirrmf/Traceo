'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  leaving?: boolean
}

type Listener = (toasts: ToastItem[]) => void

const DURATION = 4500
const EXIT_MS = 180

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l(toasts))
}

function dismiss(id: string) {
  const leavingIds = new Set(toasts.filter((t) => t.id === id).map(() => id))
  toasts = toasts.map((t) => (leavingIds.has(t.id) ? { ...t, leaving: true } : t))
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, EXIT_MS)
}

function push(variant: ToastVariant, title: string, description?: string) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, variant, title, description }]
  emit()
  setTimeout(() => dismiss(id), DURATION)
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
}

const ICON_TONES: Record<ToastVariant, string> = {
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
  error: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]',
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener: Listener = (list) => setItems(list)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
      role="status"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-md)]'
          )}
          style={{
            animation: t.leaving
              ? `toast-out ${EXIT_MS}ms ease-in forwards`
              : 'toast-in 0.2s ease-out',
          }}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              ICON_TONES[t.variant]
            )}
          >
            {ICONS[t.variant]}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
              {t.title}
            </p>
            {t.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
