import type { Metadata } from 'next'
import { LogoBrand } from '@/components/ui/logo-brand'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-dm">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 bg-[#060618] relative overflow-hidden flex-shrink-0">
        {/* Ambient Electric Blue glow accent */}
        <div className="absolute top-[-60px] left-[-60px] w-[340px] h-[340px] rounded-full bg-[#0066FF] opacity-25 blur-[90px]" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[260px] h-[260px] rounded-full bg-[#60B1FF] opacity-15 blur-[70px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <LogoBrand size="lg" variant="light" />
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-white text-3xl font-fustat font-black leading-tight tracking-tight">
            Facility Records,
            <br />
            <span className="text-[#0066FF]">Streamlined.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[320px]">
            Log monitoring visits, track account statuses, and generate reports across all JV
            categories.
          </p>

          {/* Feature list */}
          <ul className="space-y-2.5 pt-2">
            {[
              'Follow-up logs with photo evidence',
              'Export chronology to Word & PDF',
              'Role-based access control (RBAC)',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#0066FF] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-slate-500 text-xs font-mono">
          <span>&copy; 2026 Traceo. Internal System.</span>
          <span className="text-slate-400">
            Created by <strong className="text-white font-semibold font-fustat">@syaakiirr</strong>
          </span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#fafafc]">{children}</div>
    </div>
  )
}
