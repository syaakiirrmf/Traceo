import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 bg-[oklch(0.15_0.06_255)] relative overflow-hidden flex-shrink-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.9 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.9 0 0) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow accent */}
        <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-[oklch(0.45_0.16_255)] opacity-20 blur-[80px]" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full bg-[oklch(0.55_0.18_200)] opacity-15 blur-[60px]" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[oklch(0.45_0.16_255)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 4h14M3 10h9M3 16h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Traceo</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-white text-3xl font-semibold leading-tight tracking-tight">
            Facility Management<br />
            <span className="text-[oklch(0.70_0.12_255)]">Streamlined.</span>
          </h1>
          <p className="text-[oklch(0.65_0.05_255)] text-sm leading-relaxed max-w-[280px]">
            Record follow-ups, generate chronology reports, and track all JV facilities in one central platform.
          </p>

          {/* Feature list */}
          <ul className="space-y-2 pt-2">
            {[
              'Follow-up logs with notes & files',
              'Export chronology to Word & PDF',
              'Role-based access control',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[oklch(0.72_0.06_255)] text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.55_0.18_155)] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[oklch(0.42_0.04_255)] text-xs">
            © 2026 Traceo. Internal System.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--color-bg)]">
        {children}
      </div>
    </div>
  )
}
