import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { rateLimitFailOpen } from '@/lib/ratelimit'
import type { FeatureKey } from '@/types'

// Ensure only superadmin can call these APIs
async function verifySuperadmin() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { supabase, authUser: null, isSuperadmin: false }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, peranan, status')
    .eq('auth_id', authUser.id)
    .single()

  if (profile?.status === 'tidak_aktif') {
    return { supabase, authUser: null, profile: null, isSuperadmin: false }
  }

  return {
    supabase,
    authUser,
    profile,
    isSuperadmin: profile?.peranan === 'superadmin',
  }
}

// GET: fetch feature overrides for all users or a specific user_id
export async function GET(request: NextRequest) {
  const { supabase, isSuperadmin, profile } = await verifySuperadmin()
  if (!isSuperadmin || !profile) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  const rl = await rateLimitFailOpen(`superadmin:${profile.id}`, 60, 60, 'superadmin')
  if (!rl.ok) {
    Sentry.captureMessage('superadmin_429', { level: 'warning', extra: { userId: profile.id } })
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds}s before trying again.` },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = supabase.from('feature_access').select('*')
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: upsert feature override for a user
export async function POST(request: NextRequest) {
  const { supabase, isSuperadmin } = await verifySuperadmin()
  if (!isSuperadmin) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { user_id, feature_key, is_allowed } = body as {
      user_id: string
      feature_key: FeatureKey
      is_allowed: boolean
    }

    if (!user_id || !feature_key || typeof is_allowed !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields: user_id, feature_key, is_allowed' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('feature_access')
      .upsert(
        {
          user_id,
          feature_key,
          is_allowed,
          dikemaskini_pada: new Date().toISOString(),
        },
        { onConflict: 'user_id,feature_key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// DELETE: remove feature override (revert back to default role permission)
export async function DELETE(request: NextRequest) {
  const { supabase, isSuperadmin } = await verifySuperadmin()
  if (!isSuperadmin) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const featureKey = searchParams.get('feature_key')

    if (!userId || !featureKey) {
      return NextResponse.json({ error: 'user_id and feature_key query params required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('feature_access')
      .delete()
      .eq('user_id', userId)
      .eq('feature_key', featureKey)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Override removed' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete override'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
