import * as Sentry from '@sentry/nextjs'

// M7: sama seperti server — tiada span navigasi/render untuk laluan dashboard.
// Ralat + replay-ketika-ralat KEKAL di semua laluan.
function dashboardExcludedSampler(samplingContext: {
  name?: string
  normalizedRequest?: { url?: string }
}): number {
  const target = `${samplingContext?.name ?? ''} ${samplingContext?.normalizedRequest?.url ?? ''} ${
    typeof window !== 'undefined' ? window.location.pathname : ''
  }`
  if (target.includes('/dashboard')) return 0
  return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampler: dashboardExcludedSampler,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
})
