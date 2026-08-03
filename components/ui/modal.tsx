'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  icon?: React.ReactNode
  iconTone?: 'brand' | 'danger'
  children?: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  ariaLabel?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  iconTone = 'brand',
  children,
  footer,
  maxWidth = 'max-w-md',
  ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-text-primary)]/40 backdrop-blur-[2px]"
        style={{ animation: 'fade-in 0.15s ease-out' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] outline-none',
          maxWidth
        )}
        style={{ animation: 'modal-in 0.18s ease-out' }}
      >
        {(icon || title) && (
          <div className="flex items-start gap-3.5 border-b border-[var(--color-border)] p-5">
            {icon && (
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  iconTone === 'danger'
                    ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                    : 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                )}
              >
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              {title && (
                <h2 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex gap-3 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 rounded-b-[var(--radius-xl)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
