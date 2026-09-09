import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimitFailClosed, parseClientIp } from '@/lib/ratelimit'

export const runtime = 'nodejs'

function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // same-origin form / curl tanpa origin dibenarkan
  try {
    const o = new URL(origin)
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
    return o.host === host
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const ip = parseClientIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )

  const rl = await rateLimitFailClosed(`login:${ip}`, 5, 60)
  if (!rl.ok) {
    Sentry.captureMessage('auth_login_429', { level: 'warning', extra: { ip } })
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${rl.retryAfterSeconds}s before trying again.`,
      },
      { status: 429 }
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  // Kumpul cookies yang Supabase cuba set — mesti dibawa ke response
  // (bug lama: setAll swallow error lalu return ok:true tanpa Set-Cookie).
  const pendingCookies: { name: string; value: string; options?: object }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const c of cookiesToSet) {
            pendingCookies.push(c)
            try {
              cookieStore.set(c.name, c.value, c.options)
            } catch {
              // Route handler: bawa via response di bawah
            }
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  const withCookies = <T>(res: NextResponse<T>): NextResponse<T> => {
    for (const c of pendingCookies) {
      res.cookies.set(c.name, c.value, c.options as Parameters<typeof res.cookies.set>[2])
    }
    return res
  }

  if (error) {
    return withCookies(
      NextResponse.json({ error: 'Invalid email or password. Please try again.' }, { status: 401 })
    )
  }

  // Block akaun dinyahaktif SEBELUM sahkan login (jangan bagi sesi kepada mereka).
  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .eq('emel', email)
    .maybeSingle()
  if (profile?.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    return withCookies(NextResponse.json({ error: 'Account is disabled.' }, { status: 403 }))
  }

  return withCookies(NextResponse.json({ ok: true }))
}
