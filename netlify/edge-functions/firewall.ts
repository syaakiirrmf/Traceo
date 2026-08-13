import { Redis } from '@upstash/redis'
import type { Config, Context } from '@netlify/edge-functions'

const BAD_BOTS = /Bytespider|ByteDance|PetalBot|Scrapy|Go-http-client|python-requests|python-httpx|python-urllib|axios\/|Apache-HttpClient|libwww-perl|curl\/|wget|nikto|masscan|sqlmap|nmap|zgrab|blackwidow|netsparker|xrunner|HTTrack|Wasallat|41yn3|DirBuster|Xenu|binapple|pycurl|Java\/|okhttp|node-fetch|Puppeteer|HeadlessChrome|PhantomJS|Selenium/i

const BAD_EXTENSIONS = /\.(env|git|gitignore|log|bak|sql|db|ini|conf|cfg|pem|key|sh|sqlite|sqlite3|php|asp|aspx|jsp|htaccess|swp|tmp)$/i

const BANNED_PATHS = ['/.env', '/.git', '/wp-admin', '/wp-login.php', '/xmlrpc.php', '/config.json', '/package.json', '/.htpasswd', '/server-status', '/server-info', '/shell', '/cmd.exe', '/.aws', '/.ssh']

const SUSPICIOUS_KEYWORDS = /(<\s*script|alert\s*\(|onerror|javascript:|select\s+\S+\s+from|union\s+(all\s+)?select|insert\s+into|drop\s+table|--\s*$|;\s*drop|eval\s*\(|document\.cookie|\.\.\/\.\.\/|base64_decode|whoami|cat\s+\/etc\/passwd)/i

// Per-IP limits for the publicly reachable paths. Auth handlers are already
// rate-limited server-side (Redis); this edge layer is a coarse first line.
const IP_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  '/login': { limit: 20, windowSeconds: 60 },
  '/api/auth/login': { limit: 20, windowSeconds: 60 },
}

let redis: Redis | null | undefined

function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = Redis.fromEnv()
    } catch {
      redis = null
    }
  } else {
    redis = null
  }
  return redis
}

function shouldBlock(request: Request, context: Context): boolean {
  const { pathname, searchParams } = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  const countryCode = context.geo?.country?.code || ''

  const denyCountries: string[] = []

  if (denyCountries.includes(countryCode)) return true
  if (pathname === '/' || pathname === '/login') return false

  if (!userAgent || BAD_BOTS.test(userAgent)) return true
  if (BAD_EXTENSIONS.test(pathname)) return true
  if (BANNED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true

  const queryString = searchParams.toString()
  if (SUSPICIOUS_KEYWORDS.test(`${pathname} ${queryString} ${referer}`)) return true

  return false
}

export default async function firewall(
  request: Request,
  context: Context
): Promise<Response> {
  if (shouldBlock(request, context)) {
    console.log(
      JSON.stringify({
        level: 'warn',
        message: 'Blocked request',
        url: request.url,
        ua: request.headers.get('user-agent'),
        ip: context.ip,
        country: context.geo?.country?.name,
      })
    )
    return new Response('Access denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // ─── Coarse per-IP rate limit on auth/entry paths (best-effort) ────────────
  const { pathname } = new URL(request.url)
  const limitConfig = IP_LIMITS[pathname]
  if (limitConfig) {
    const client = getRedis()
    if (client) {
      try {
        const key = `fw:${pathname}:${context.ip ?? 'unknown'}`
        const count = await client.incr(key)
        if (count === 1) await client.expire(key, limitConfig.windowSeconds)
        if (count > limitConfig.limit) {
          return new Response('Too many requests', {
            status: 429,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }
      } catch (err) {
        console.log(JSON.stringify({ level: 'warn', message: 'rate-limit skip', err: String(err) }))
      }
    }
  }

  return context.next()
}

export const config: Config = {
  path: ['/*'],
  excludedPath: [
    '/_next/*',
    '/*.css',
    '/*.js',
    '/*.json',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.gif',
    '/*.svg',
    '/*.webp',
    '/*.ico',
    '/*.woff',
    '/*.woff2',
    '/*.ttf',
    '/*.mp4',
  ],
}
