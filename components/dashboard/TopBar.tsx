'use client'

import { Bell } from 'lucide-react'
import type { User } from '@/types'
import { getRoleLabel } from '@/lib/auth/permissions'

interface TopBarProps {
  user: User
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-[68px] flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-200/80 bg-[#fcfbf9]/95 backdrop-blur-md">
      {/* Left: current page greeting */}
      <div id="topbar-title" className="text-[13.5px] font-medium text-slate-600">
        Welcome, <span className="font-bold text-slate-900">{user.nama.split(' ')[0]}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 border border-slate-200/60 shadow-2xs"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Role badge */}
        <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
          {getRoleLabel(user.peranan)}
        </span>
      </div>
    </header>
  )
}
