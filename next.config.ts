import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    // M6: cache router 120s (naik dari 30s) — navigasi ulang guna payload
    // yang disimpan, terasa instant macam client-router. Selamat kerana
    // semua mutasi memanggil revalidatePath (cache dibatal serta-merta).
    staleTimes: {
      dynamic: 120,
    },
  },
}

export default withSentryConfig(nextConfig, {
  org: 'syaakiirr',
  project: 'traceo',
  silent: !process.env.CI,
})
