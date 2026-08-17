import React from 'react'
import { checkFeatureAccess } from '@/lib/auth/access-control'
import { UnderDevelopmentPage } from './UnderDevelopmentPage'
import type { UserRole, FeatureKey } from '@/types'

interface FeatureGateProps {
  userId: string
  role: UserRole
  feature: FeatureKey
  featureName?: string
  fallback?: React.ReactNode
  showBanner?: boolean
  children: React.ReactNode
}

export async function FeatureGate({
  userId,
  role,
  feature,
  featureName,
  fallback = null,
  showBanner = false,
  children,
}: FeatureGateProps) {
  const isAllowed = await checkFeatureAccess(userId, role, feature)

  if (!isAllowed) {
    if (showBanner) {
      return (
        <UnderDevelopmentPage
          minimal
          featureName={featureName || feature}
          description="Ciri ini dihadkan oleh polisi akses pentadbiran."
        />
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
