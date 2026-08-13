'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { PageTransitionShell } from '@/components/dashboard/PageTransitionShell'
import type { User } from '@/types'

interface DashboardShellProps {
  user: User
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Desktop Sidebar (hidden on mobile, fixed w-[240px] on lg:) */}
      <div className="hidden lg:block h-full" style={{ viewTransitionName: 'traceo-sidebar' }}>
        <Sidebar user={user} />
      </div>

      {/* Mobile & Small Screen Drawer Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Slide-over Drawer */}
          <div className="relative flex-1 max-w-xs w-full bg-[#fcfbf9] h-full shadow-2xl z-10">
            <Sidebar user={user} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={user} onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageTransitionShell>{children}</PageTransitionShell>
        </main>
      </div>
    </div>
  )
}
