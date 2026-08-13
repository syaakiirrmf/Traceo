import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rl = await rateLimit(`login:${ip}`, 5, 60)
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percubaan log masuk. Sila tunggu ${rl.retryAfterSeconds}s sebelum mencuba lagi.`,
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
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore — route handler response will carry the Set-Cookie headers
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json(
      { error: 'Invalid email or password. Please try again.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
