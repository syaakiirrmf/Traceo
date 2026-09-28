import * as Sentry from '@sentry/nextjs'

// M7: span prestasi (traces) dimatikan untuk laluan dashboard — render page
// tidak lagi menanggung penghantaran span. Ralat (captureException /
// captureMessage yang dipanggil eksplisit dalam kod) KEKAL dilaporkan di
// semua laluan, termasuk dashboard. API/export kekal disampel seperti biasa.
// (Medan ikut bentuk sebenar TracesSamplerSamplingContext Sentry v10:
// name + normalizedRequest.url.)
function dashboardExcludedSampler(samplingContext: {
  name?: string
  normalizedRequest?: { url?: string }
}): number {
  const target = `${samplingContext?.name ?? ''} ${samplingContext?.normalizedRequest?.url ?? ''}`
  if (target.includes('/dashboard')) return 0
  return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampler: dashboardExcludedSampler,
  debug: false,
})
