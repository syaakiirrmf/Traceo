import React from 'react'
import { checkPageAccess } from '@/lib/auth/access-control'
import { UnderDevelopmentPage } from './UnderDevelopmentPage'
import type { UserRole, PageKey } from '@/types'

interface PageAccessGuardProps {
  userId: string
  role: UserRole
  pagePath: PageKey
  featureName?: string
  children: React.ReactNode
}

export async function PageAccessGuard({
  userId,
  role,
  pagePath,
  featureName,
  children,
}: PageAccessGuardProps) {
  const isAllowed = await checkPageAccess(userId, role, pagePath)

  if (!isAllowed) {
    return <UnderDevelopmentPage featureName={featureName} />
  }

  return <>{children}</>
}
