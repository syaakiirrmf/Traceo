'use client'

import { useEffect, useRef } from 'react'
import { toast } from '@/components/ui/toast'

export function ProfilToast({ success }: { success?: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (!success || fired.current) return
    fired.current = true
    toast.success(
      success === 'profil' ? 'Profile updated' : 'Password changed',
      'Your changes have been saved.'
    )
  }, [success])

  return null
}