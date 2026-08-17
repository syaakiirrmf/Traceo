import { createClient } from '@/lib/supabase/server'
import { hasPermission } from './permissions'
import type { UserRole, FeatureKey, PageKey } from '@/types'

/**
 * Check if a user (by their users.id) has access to a feature.
 * Superadmin always returns true without hitting the DB.
 */
export async function checkFeatureAccess(
  userId: string,
  role: UserRole,
  feature: FeatureKey
): Promise<boolean> {
  if (role === 'superadmin') return true

  const supabase = await createClient()

  const { data: override } = await supabase
    .from('feature_access')
    .select('is_allowed')
    .eq('user_id', userId)
    .eq('feature_key', feature)
    .maybeSingle()

  // If there's an explicit override, use it
  if (override !== null && override !== undefined) {
    return override.is_allowed
  }

  // Otherwise fall back to static matrix
  return hasPermission(role, feature)
}

/**
 * Check if a user has access to a page path.
 * Superadmin always returns true without hitting the DB.
 */
export async function checkPageAccess(
  userId: string,
  role: UserRole,
  pagePath: PageKey
): Promise<boolean> {
  if (role === 'superadmin') return true

  const supabase = await createClient()

  const { data: override } = await supabase
    .from('page_access')
    .select('is_allowed')
    .eq('user_id', userId)
    .eq('page_path', pagePath)
    .maybeSingle()

  // If there's an explicit override, use it
  if (override !== null && override !== undefined) {
    return override.is_allowed
  }

  // Default: all authenticated roles can access most pages
  // unless there's a specific restriction
  return true
}

/**
 * Fetch all feature + page overrides for a given user (for superadmin panel).
 */
export async function getUserAccessOverrides(userId: string) {
  const supabase = await createClient()

  const [{ data: features }, { data: pages }] = await Promise.all([
    supabase
      .from('feature_access')
      .select('feature_key, is_allowed')
      .eq('user_id', userId),
    supabase
      .from('page_access')
      .select('page_path, is_allowed')
      .eq('user_id', userId),
  ])

  return {
    features: features ?? [],
    pages: pages ?? [],
  }
}
