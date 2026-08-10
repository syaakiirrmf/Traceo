'use client'

import { Bell, Menu } from 'lucide-react'
import type { User } from '@/types'
import { getRoleLabel } from '@/lib/auth/permissions'

interface TopBarProps {
  user: User
  onMenuToggle?: () => void
}

export function TopBar({ user, onMenuToggle }: TopBarProps) {
  return (
    <header className="h-[68px] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 bg-[#fcfbf9]/95 backdrop-blur-md">
      {/* Left: Hamburger menu toggle + current page greeting */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div id="topbar-title" className="text-[13.5px] font-medium text-slate-600 truncate">
          Welcome, <span className="font-bold text-slate-900">{user.nama.split(' ')[0]}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 border border-slate-200/60 shadow-2xs"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Role badge */}
        <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[11.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs whitespace-nowrap">
          {getRoleLabel(user.peranan)}
        </span>
      </div>
    </header>
  )
}
