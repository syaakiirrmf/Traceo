import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CSP_BASE =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; font-src 'self'; connect-src 'self' https://ncexqufycjbzhxwbatqx.supabase.co wss://ncexqufycjbzhxwbatqx.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.upstash.io https://generativelanguage.googleapis.com https://api.resend.com https://va.vercel-scripts.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"

// React dev (Turbopack) memerlukan eval() untuk debugging stacks — benarkan
// 'unsafe-eval' ketika development sahaja. Production build React tidak
// guna eval langsung, jadi prod kekal ketat.
const CSP_SCRIPT_SRC =
  process.env.NODE_ENV !== 'production'
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com"
    : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // CSP asas untuk app shell; Netlify edge menambah yang lebih ketat di prod.
  // Sentry/Upstash/Gemini/Cloudinary dibenarkan (sebelum ini connect-src 'self'
  // sahaja menyekat event client + imej Cloudinary).
  'Content-Security-Policy': `${CSP_SCRIPT_SRC}; ${CSP_BASE}`,
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // Jangan timpa Set-Cookie; headers keselamatan sahaja.
    res.headers.set(name, value)
  }
  return res
}

// Laluan yang tidak perlu auth langsung.
const PUBLIC_ROUTES = ['/', '/login', '/api/auth/login']

// NOTA prestasi (Q1): middleware hanya semak sesi (auth.getUser untuk refresh
// cookie). Tiada select users / semak peranan di sini — RBAC penuh dibuat di
// layout + page (assertPageAccess / semak manual), yang berkongsi cache
// request yang sama. Ini buang 1-2 roundtrip DB dari setiap navigation.

export async function proxy(request: NextRequest) {
  let supabaseResponse = applySecurityHeaders(NextResponse.next({ request }))

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
          // Bina response BARU tetapi kekalkan security headers (bug lama: hilang).
          supabaseResponse = NextResponse.next({ request })
          applySecurityHeaders(supabaseResponse)
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

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (user && !pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
    }
    return supabaseResponse
  }

  if (!user) {
    // API: 401 JSON (bukan redirect HTML). Halaman: redirect login.
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  // RBAC lapisan-edge yang tinggal: laluan superadmin sahaja dikekalkan di sini
  // kerana kesannya API sensitif (bukan page — page ada semak sendiri).
  // Semak tidak_aktif + peranan lain dibuat di layout/page (assertPageAccess)
  // yang berkongsi cache request — lebih murah dari query edge berasingan.
  if (pathname.startsWith('/api/health')) {
    return supabaseResponse // auth sudah disemak di atas; tidak lagi public
  }
  if (pathname.startsWith('/api/superadmin')) {
    const { data: profile } = await supabase
      .from('users')
      .select('peranan')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (!profile || (profile.peranan as string) !== 'superadmin') {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      )
    }
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
