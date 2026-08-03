import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default withSentryConfig(nextConfig, {
  org: 'syaakiirr',
  project: 'traceo',
  silent: !process.env.CI,
})
