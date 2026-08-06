import type { Metadata } from 'next'
import HeroSection from '@/components/hero/HeroSection'

export const metadata: Metadata = {
  title: 'Traceo — Pengurusan Fasiliti JV',
  description:
    'Sistem pengurusan fasiliti JV dan laporan kronologi. Rekod, pantau, dan jana laporan dengan tepat.',
}

export default function HomePage() {
  return <HeroSection />
}
