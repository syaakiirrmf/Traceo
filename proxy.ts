import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; font-src 'self'; connect-src 'self' https://ncexqufycjbzhxwbatqx.supabase.co wss://ncexqufycjbzhxwbatqx.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.upstash.io https://generativelanguage.googleapis.com https://api.resend.com https://va.vercel-scripts.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
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

// Prefix halaman yang memerlukan peranan minimum (lapisan pertama;
// semak penuh kekal di layout + server actions + API routes).
const ADMIN_PAGES = ['/dashboard/users', '/dashboard/superadmin', '/dashboard/audit']
const TANAH_PAGES = ['/dashboard/tanah-jv']

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

  // Semak status + peranan (block tidak_aktif di edge, bukan hanya layout).
  const { data: profile } = await supabase
    .from('users')
    .select('peranan, status')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!profile || profile.status === 'tidak_aktif') {
    await supabase.auth.signOut()
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Account is disabled.' }, { status: 403 })
      )
    }
    const login = NextResponse.redirect(new URL('/login?disabled=1', request.url))
    return applySecurityHeaders(login)
  }

  const role = profile.peranan as string

  // RBAC lapisan-edge (kasar; semak halus di route/action).
  if (pathname.startsWith('/api/health')) {
    return supabaseResponse // auth sudah disemak di atas; tidak lagi public
  }
  if (pathname.startsWith('/api/superadmin')) {
    if (role !== 'superadmin') {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      )
    }
    return supabaseResponse
  }
  if (ADMIN_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (role !== 'admin' && role !== 'superadmin') {
      const denied = NextResponse.redirect(new URL('/dashboard?denied=1', request.url))
      return applySecurityHeaders(denied)
    }
  }
  if (TANAH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (role !== 'admin' && role !== 'pengurus' && role !== 'superadmin' && role !== 'viewer') {
      const denied = NextResponse.redirect(new URL('/dashboard?denied=1', request.url))
      return applySecurityHeaders(denied)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
