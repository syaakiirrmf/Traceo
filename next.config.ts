import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default withSentryConfig(nextConfig, {
  org: 'syaakiirr',
  project: 'traceo',
  silent: !process.env.CI,
})
