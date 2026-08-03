'use client'

import { Bell } from 'lucide-react'
import type { User } from '@/types'
import { getRoleLabel } from '@/lib/auth/permissions'

interface TopBarProps {
  user: User
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Left: current page title rendered by children */}
      <div id="topbar-title" className="text-sm font-medium text-[var(--color-text-secondary)]">
        Selamat datang, <span className="text-[var(--color-text-primary)]">{user.nama.split(' ')[0]}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-secondary)] transition-colors duration-150"
          aria-label="Notifikasi"
        >
          <Bell size={16} />
        </button>

        {/* Role badge */}
        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-brand-subtle)] text-[var(--color-brand)] leading-tight">
          {getRoleLabel(user.peranan)}
        </span>
      </div>
    </header>
  )
}
