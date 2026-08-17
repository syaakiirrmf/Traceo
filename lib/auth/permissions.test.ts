import { describe, expect, it } from 'vitest'
import { hasPermission, getRoleLabel, requireRole } from '@/lib/auth/permissions'

describe('hasPermission', () => {
  it('allows superadmin for all permissions unconditionally', () => {
    expect(hasPermission('superadmin', 'urus_pengguna')).toBe(true)
    expect(hasPermission('superadmin', 'lihat_audit_log')).toBe(true)
    expect(hasPermission('superadmin', 'padam_fasiliti')).toBe(true)
    expect(hasPermission('superadmin', 'jana_kronologi')).toBe(true)
    expect(hasPermission('superadmin', 'lihat_assistant')).toBe(true)
  })

  it('allows admin for every permission', () => {
    expect(hasPermission('admin', 'urus_pengguna')).toBe(true)
    expect(hasPermission('admin', 'lihat_audit_log')).toBe(true)
    expect(hasPermission('admin', 'padam_fasiliti')).toBe(true)
    expect(hasPermission('admin', 'jana_kronologi')).toBe(true)
  })

  it('allows pengurus to manage facilities but not users', () => {
    expect(hasPermission('pengurus', 'tambah_fasiliti')).toBe(true)
    expect(hasPermission('pengurus', 'edit_fasiliti')).toBe(true)
    expect(hasPermission('pengurus', 'padam_fasiliti')).toBe(false)
    expect(hasPermission('pengurus', 'urus_pengguna')).toBe(false)
    expect(hasPermission('pengurus', 'lihat_audit_log')).toBe(false)
  })

  it('allows pegawai_susulan to add/edit/delete their own follow-ups', () => {
    expect(hasPermission('pegawai_susulan', 'tambah_susulan')).toBe(true)
    expect(hasPermission('pegawai_susulan', 'edit_susulan_sendiri')).toBe(true)
    expect(hasPermission('pegawai_susulan', 'padam_susulan')).toBe(true)
    expect(hasPermission('pegawai_susulan', 'edit_susulan_orang_lain')).toBe(false)
  })

  it('allows viewer read-only access', () => {
    expect(hasPermission('viewer', 'lihat_semua_fasiliti')).toBe(true)
    expect(hasPermission('viewer', 'jana_kronologi')).toBe(true)
    expect(hasPermission('viewer', 'lihat_dashboard')).toBe(true)
    expect(hasPermission('viewer', 'tambah_fasiliti')).toBe(false)
    expect(hasPermission('viewer', 'tambah_susulan')).toBe(false)
    expect(hasPermission('viewer', 'urus_pengguna')).toBe(false)
  })

  it('denies unknown role/permission combinations safely', () => {
    expect(hasPermission('viewer' as never, 'urus_pengguna' as never)).toBe(false)
  })
})

describe('getRoleLabel', () => {
  it('returns readable labels for all roles', () => {
    expect(getRoleLabel('admin')).toBe('Admin')
    expect(getRoleLabel('pengurus')).toBe('Manager')
    expect(getRoleLabel('pegawai_susulan')).toBe('Follow-up Officer')
    expect(getRoleLabel('viewer')).toBe('Viewer')
  })
})

describe('requireRole', () => {
  it('does not throw when role has permission', () => {
    expect(() => requireRole('admin', 'urus_pengguna')).not.toThrow()
  })

  it('throws when role lacks permission', () => {
    expect(() => requireRole('viewer', 'urus_pengguna')).toThrow(/Access denied/)
  })
})
