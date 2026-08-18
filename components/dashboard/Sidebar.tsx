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
  Crown,
  CalendarDays,
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
  superadminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/dashboard/superadmin',
    label: 'Superadmin Panel',
    icon: Crown,
    superadminOnly: true,
  },
  { href: '/dashboard/summary/jv1', label: 'Summary JV 1', icon: Building2 },
  { href: '/dashboard/summary/jv2', label: 'Land JV', icon: LayoutList },
  { href: '/dashboard/summary/jv3', label: 'Personal Loan', icon: LayoutList },
  {
    href: '/dashboard/tanah-jv',
    label: 'Tanah MD (JV)',
    icon: MapPin,
    permission: 'tambah_fasiliti',
  },
  { href: '/dashboard/fasiliti', label: 'Facilities (All)', icon: Building2 },
  {
    href: '/dashboard/susulan',
    label: 'Follow-Up Calendar',
    icon: CalendarDays,
    permission: 'tambah_susulan',
  },
  {
    href: '/dashboard/assistant',
    label: '@syaakiirr',
    icon: Sparkles,
    permission: 'tambah_susulan',
  },
  { href: '/dashboard/users', label: 'Users', icon: Users, permission: 'urus_pengguna' },
  {
    href: '/dashboard/audit',
    label: 'Audit Log',
    icon: ClipboardList,
    permission: 'lihat_audit_log',
  },
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

  const visibleNav = navItems
    .filter((item) => {
      if (item.superadminOnly && user.peranan !== 'superadmin') return false
      return !item.permission || hasPermission(user.peranan, item.permission)
    })
    .map((item) => {
      // Rename 'Facilities (All)' to 'My Facilities' for Pegawai Susulan
      if (item.href === '/dashboard/fasiliti' && user.peranan === 'pegawai_susulan') {
        return { ...item, label: 'My Facilities' }
      }
      return item
    })

  return (
    <aside
      className={cn(
        'w-[240px] flex-shrink-0 flex flex-col border-r border-slate-200/70 bg-white/90 backdrop-blur-md h-full font-dm',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-[68px] border-b border-slate-200/70 bg-white">
        <Link href="/" className="hover:opacity-90 transition-opacity">
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
          const isSuperadminItem = item.superadminOnly
          const isActive =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose && onClose()}
              className={cn(
                'group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200',
                isSuperadminItem
                  ? isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 shadow-xs'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-500/[0.06] hover:bg-amber-500/12 border border-amber-500/20'
                  : isActive
                  ? 'bg-[#0066FF]/10 text-[#0066FF] font-semibold border border-[#0066FF]/20 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isSuperadminItem
                    ? 'text-amber-500'
                    : isActive
                    ? 'text-[#0066FF]'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight
                  size={13}
                  className={cn('opacity-80', isSuperadminItem ? 'text-amber-500' : 'text-[#0066FF]')}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-3 border-t border-slate-200/70 pt-3">
        <Link
          href="/dashboard/profil"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-100/70 transition-colors group"
        >
          {/* Avatar */}
          <div
            className={cn(
              'w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0',
              user.peranan === 'superadmin'
                ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                : 'bg-[#EBF2FF] text-[#0066FF] border-[#0066FF]/20'
            )}
          >
            {user.peranan === 'superadmin' ? (
              <Crown size={14} className="text-amber-500" />
            ) : (
              <span className="text-[11px] font-bold">{getInitials(user.nama)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {user.nama}
            </p>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              {getRoleLabel(user.peranan)}
            </p>
          </div>
          <UserCircle2
            size={14}
            className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </Link>

        <button
          onClick={handleSignOut}
          className="mt-1.5 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Sign out
        </button>

        {/* Creator Branding */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>System Architect</span>
          <span className="font-bold text-[#0066FF] tracking-tight">@syaakiirr</span>
        </div>
      </div>
    </aside>
  )
}
