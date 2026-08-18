import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/ratelimit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

import { POST as loginPost } from '@/app/api/auth/login/route'
import { rateLimit } from '@/lib/ratelimit'
import { createServerClient } from '@supabase/ssr'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(rateLimit as Mock).mockResolvedValue({
      ok: true,
      remaining: 4,
      retryAfterSeconds: 0,
    })
  })

  function req(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 400 for missing credentials', async () => {
    const res = await loginPost(req({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Email and password are required/)
  })

  it('returns 400 for invalid JSON body', async () => {
    const r = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    })
    const res = await loginPost(r)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Invalid request body/)
  })

  it('returns 429 when rate limited', async () => {
    ;(rateLimit as Mock).mockResolvedValue({
      ok: false,
      remaining: 0,
      retryAfterSeconds: 42,
    })
    const res = await loginPost(req({ email: 'a@b.com', password: 'x' }))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/42s/)
  })

  it('returns 401 on invalid credentials', async () => {
    ;(createServerClient as Mock).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          error: { message: 'Invalid login credentials' },
        })),
      },
    })
    const res = await loginPost(req({ email: 'a@b.com', password: 'wrong' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid email or password/)
  })

  it('returns 200 on successful login', async () => {
    ;(createServerClient as Mock).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({ error: null })),
      },
    })
    const res = await loginPost(req({ email: 'a@b.com', password: 'secret' }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('normalizes email to lowercase', async () => {
    const signIn = vi.fn(async () => ({ error: null }))
    ;(createServerClient as Mock).mockReturnValue({
      auth: { signInWithPassword: signIn },
    })
    await loginPost(req({ email: 'User@Example.COM', password: 'x' }))
    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'x',
    })
  })
})
