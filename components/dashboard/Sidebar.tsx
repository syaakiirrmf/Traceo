'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  LogOut,
  ChevronRight,
  UserCircle2,
  MapPin,
  LayoutList,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import type { User } from '@/types'
import { hasPermission, getRoleLabel } from '@/lib/auth/permissions'
import { LogoBrand } from '@/components/ui/logo-brand'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission?: Parameters<typeof hasPermission>[1]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/summary/jv1', label: 'Summary JV 1', icon: Building2 },
  { href: '/dashboard/summary/jv2', label: 'Land JV', icon: LayoutList },
  { href: '/dashboard/summary/jv3', label: 'Personal Loan', icon: LayoutList },
  { href: '/dashboard/tanah-jv', label: 'Tanah MD (JV)', icon: MapPin },
  { href: '/dashboard/fasiliti', label: 'Facilities (All)', icon: Building2 },
  { href: '/dashboard/assistant', label: '@syaakiirr', icon: Sparkles },
  { href: '/dashboard/users', label: 'Users', icon: Users, permission: 'urus_pengguna' },
  { href: '/dashboard/audit', label: 'Audit Log', icon: ClipboardList, permission: 'lihat_audit_log' },
]

interface SidebarProps {
  user: User
  onClose?: () => void
  className?: string
}

export function Sidebar({ user, onClose, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    if (onClose) onClose()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleNav = navItems.filter(
    (item) => !item.permission || hasPermission(user.peranan, item.permission)
  )

  return (
    <aside className={cn("w-[240px] flex-shrink-0 flex flex-col border-r border-slate-200/70 bg-white/90 backdrop-blur-md h-full font-dm", className)}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-[68px] border-b border-slate-200/70 bg-white">
        <Link href="/" transitionTypes={['nav-back']}>
          <LogoBrand size="md" variant="dark" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            &times;
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              transitionTypes={['page-nav']}
              className={cn(
                'group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#0066FF]/10 text-[#0066FF] font-semibold border border-[#0066FF]/20 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-[#0066FF]' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight size={13} className="text-[#0066FF] opacity-80" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-3 border-t border-slate-200/70 pt-3">
        <Link
          href="/dashboard/profil"
          transitionTypes={['page-nav']}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-100/70 transition-colors group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#EBF2FF] border border-[#0066FF]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-[#0066FF]">
              {getInitials(user.nama)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {user.nama}
            </p>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              {getRoleLabel(user.peranan)}
            </p>
          </div>
          <UserCircle2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <button
          onClick={handleSignOut}
          className="mt-1.5 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
