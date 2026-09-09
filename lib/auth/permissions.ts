import { type UserRole, type FeatureKey } from '@/types'

// ─── Static Permission Matrix ────────────────────────────────────────────────
// superadmin always has full access — it is first in every array.

const PERMISSIONS: Record<string, UserRole[]> = {
  urus_pengguna:           ['superadmin', 'admin'],
  tambah_fasiliti:         ['superadmin', 'admin', 'pengurus'],
  edit_fasiliti:           ['superadmin', 'admin', 'pengurus'],
  padam_fasiliti:          ['superadmin', 'admin'],
  lihat_fasiliti:          ['superadmin', 'admin', 'pengurus', 'pegawai_susulan', 'viewer'],
  lihat_semua_fasiliti:    ['superadmin', 'admin', 'pengurus', 'viewer'],
  tambah_susulan:          ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  lihat_susulan:           ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  edit_susulan:            ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  edit_susulan_sendiri:    ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  edit_susulan_orang_lain: ['superadmin', 'admin', 'pengurus'],
  padam_susulan:           ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  jana_kronologi:          ['superadmin', 'admin', 'pengurus', 'pegawai_susulan', 'viewer'],
  eksport_excel:           ['superadmin', 'admin', 'pengurus'],
  eksport_ringkasan:       ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  lihat_audit_log:         ['superadmin', 'admin'],
  lihat_dashboard:         ['superadmin', 'admin', 'pengurus', 'pegawai_susulan', 'viewer'],
  lihat_assistant:         ['superadmin', 'admin', 'pengurus', 'pegawai_susulan'],
  lihat_tanah_jv:          ['superadmin', 'admin', 'pengurus'],
  lihat_summary:           ['superadmin', 'admin', 'pengurus', 'pegawai_susulan', 'viewer'],
}

export type Permission = FeatureKey | keyof typeof PERMISSIONS

// ─── Static Helpers ───────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === 'superadmin') return true
  const allowed = PERMISSIONS[permission as string]
  if (!allowed) return false
  return (allowed as readonly UserRole[]).includes(role)
}

export function requireRole(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Access denied: role '${role}' cannot perform '${permission}'`)
  }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    superadmin:      'Superadmin',
    admin:           'Admin',
    pengurus:        'Manager',
    pegawai_susulan: 'Follow-up Officer',
    viewer:          'Viewer',
  }
  return labels[role] ?? role
}

// ─── Static Page → Permission Map ─────────────────────────────────────────────
// Single source of truth for page-level authorization. PageAccessGuard and
// assertPageAccess both resolve pages through this map; unmapped pages DENY.
export const PAGE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard':              'lihat_dashboard',
  '/dashboard/fasiliti':     'lihat_fasiliti',
  '/dashboard/tanah-jv':     'lihat_tanah_jv',
  '/dashboard/summary':      'lihat_summary',
  '/dashboard/summary/jv1':  'lihat_summary',
  '/dashboard/summary/jv2':  'lihat_summary',
  '/dashboard/summary/jv3':  'lihat_summary',
  '/dashboard/audit':        'lihat_audit_log',
  '/dashboard/users':        'urus_pengguna',
  '/dashboard/assistant':    'lihat_assistant',
  '/dashboard/profil':       'lihat_dashboard',
  '/dashboard/susulan':      'lihat_susulan',
  '/dashboard/superadmin':   'urus_pengguna',
}
