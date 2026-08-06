import type { Metadata } from 'next'
import { LogoBrand } from '@/components/ui/logo-brand'

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
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 bg-slate-900 relative overflow-hidden flex-shrink-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Ambient Teal glow accent */}
        <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-teal-600 opacity-20 blur-[80px]" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full bg-teal-500 opacity-15 blur-[60px]" />

        {/* Logo */}
        <div className="relative z-10">
          <LogoBrand size="lg" variant="light" />
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-white text-3xl font-extrabold leading-tight tracking-tight">
            Facility Management<br />
            <span className="text-teal-400">Streamlined.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[300px]">
            Record follow-ups, generate chronology reports, and track all JV facilities in one central platform.
          </p>

          {/* Feature list */}
          <ul className="space-y-2.5 pt-2">
            {[
              'Follow-up logs with notes & files',
              'Export chronology to Word & PDF',
              'Role-based access control (RBAC)',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-mono">
            &copy; 2026 Traceo. Internal System.
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
