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

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission?: Parameters<typeof hasPermission>[1]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/summary/jv1', label: 'Summary JV 1', icon: Building2 },
  { href: '/dashboard/summary/jv2', label: 'JV Tanah', icon: LayoutList },
  { href: '/dashboard/summary/jv3', label: 'Personal Loan', icon: LayoutList },
  { href: '/dashboard/tanah-jv', label: 'Tanah MD (JV)', icon: MapPin },
  { href: '/dashboard/fasiliti', label: 'Facilities (All)', icon: Building2 },
  { href: '/dashboard/assistant', label: '@syaakiirr', icon: Sparkles },
  { href: '/dashboard/users', label: 'Users', icon: Users, permission: 'urus_pengguna' },
  { href: '/dashboard/audit', label: 'Audit Log', icon: ClipboardList, permission: 'lihat_audit_log' },
]

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleNav = navItems.filter(
    (item) => !item.permission || hasPermission(user.peranan, item.permission)
  )

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--color-border)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M3 4h14M3 10h9M3 16h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-[var(--color-text-primary)]">
          Traceo
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight size={12} className="text-[var(--color-brand)] opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-3 border-t border-[var(--color-border)] pt-3">
        <Link
          href="/dashboard/profil"
          className="flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-raised)] transition-colors group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-[var(--color-brand)]">
              {getInitials(user.nama)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate leading-tight">
              {user.nama}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] truncate leading-tight">
              {getRoleLabel(user.peranan)}
            </p>
          </div>
          <UserCircle2 size={14} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <button
          onClick={handleSignOut}
          className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] transition-all duration-150"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
