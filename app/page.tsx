import type { Metadata } from 'next'
import HeroSection from '@/components/hero/HeroSection'

export const metadata: Metadata = {
  title: 'Traceo — JV Facility Management',
  description:
    'JV facility management system and chronology reports. Record, monitor, and generate reports accurately.',
}

export default function HomePage() {
  return <HeroSection />
}
