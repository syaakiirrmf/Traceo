'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="animate-page-enter w-full">
      {children}
    </div>
  )
}

