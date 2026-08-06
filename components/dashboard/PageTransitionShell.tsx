'use client'

import { ViewTransition } from 'react'

/**
 * PageTransitionShell
 *
 * Thin client component that wraps dashboard page content in a
 * <ViewTransition> shell. Kept separate from the server layout so the
 * layout can remain a server component (it does async Supabase auth).
 *
 * Transition type mapping:
 *   page-nav     → sidebar peer-level navigation (crossfade)
 *   nav-forward  → going deeper into the app
 *   nav-back     → going up / back
 *   default:none → no animation on unrelated transitions (e.g. initial SSR)
 */
export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        'page-nav': 'page-nav',
        default: 'none',
      }}
      exit={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        'page-nav': 'page-nav',
        default: 'none',
      }}
    >
      {children}
    </ViewTransition>
  )
}
