import { type UserRole } from '@/types'

// ─── Permission Matrix ────────────────────────────────────────────────────────

const PERMISSIONS = {
  urus_pengguna: ['admin'] as UserRole[],
  tambah_fasiliti: ['admin', 'pengurus'] as UserRole[],
  edit_fasiliti: ['admin', 'pengurus'] as UserRole[],
  padam_fasiliti: ['admin'] as UserRole[],
  lihat_semua_fasiliti: ['admin', 'pengurus', 'viewer'] as UserRole[],
  tambah_susulan: ['admin', 'pengurus', 'pegawai_susulan'] as UserRole[],
  edit_susulan_sendiri: ['admin', 'pengurus', 'pegawai_susulan'] as UserRole[],
  edit_susulan_orang_lain: ['admin', 'pengurus'] as UserRole[],
  padam_susulan: ['admin', 'pengurus', 'pegawai_susulan'] as UserRole[],
  jana_kronologi: ['admin', 'pengurus', 'pegawai_susulan', 'viewer'] as UserRole[],
  lihat_dashboard: ['admin', 'pengurus', 'pegawai_susulan', 'viewer'] as UserRole[],
  lihat_audit_log: ['admin'] as UserRole[],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role)
}

export function requireRole(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Access denied: role '${role}' is not allowed for '${permission}'`)
  }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    pengurus: 'Manager',
    pegawai_susulan: 'Follow-up Officer',
    viewer: 'Viewer',
  }
  return labels[role]
}
