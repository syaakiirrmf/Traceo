import type { Metadata } from 'next'
import NotFoundPage from '@/components/not-found/NotFoundPage'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default function NotFound() {
  return <NotFoundPage />
}