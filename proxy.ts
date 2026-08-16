import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) =>
    supabaseResponse.headers.set(name, value)
  )

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const publicRoutes = ['/', '/login', '/api/auth/login']
  if (publicRoutes.includes(pathname)) {
    // If already logged in and visiting a page route, redirect to dashboard
    if (user && !pathname.startsWith('/api/')) {
      const redirect = NextResponse.redirect(new URL('/dashboard', request.url))
      Object.entries(SECURITY_HEADERS).forEach(([name, value]) =>
        redirect.headers.set(name, value)
      )
      return redirect
    }
    return supabaseResponse
  }

  // Protected routes — must be logged in
  if (!user) {
    const redirect = NextResponse.redirect(new URL('/login', request.url))
    Object.entries(SECURITY_HEADERS).forEach(([name, value]) =>
      redirect.headers.set(name, value)
    )
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
