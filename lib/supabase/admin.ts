import { createClient as createServerClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using service_role key.
 * Only for use in Server Actions and API routes — NEVER expose to client.
 * Bypasses RLS — use with care.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
