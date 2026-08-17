import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PageKey } from '@/types'

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
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  return {
    supabase,
    authUser,
    profile,
    isSuperadmin: profile?.peranan === 'superadmin',
  }
}

// GET: fetch page overrides for all users or a specific user_id
export async function GET(request: NextRequest) {
  const { supabase, isSuperadmin } = await verifySuperadmin()
  if (!isSuperadmin) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = supabase.from('page_access').select('*')
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: upsert page override for a user
export async function POST(request: NextRequest) {
  const { supabase, isSuperadmin } = await verifySuperadmin()
  if (!isSuperadmin) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { user_id, page_path, is_allowed } = body as {
      user_id: string
      page_path: PageKey
      is_allowed: boolean
    }

    if (!user_id || !page_path || typeof is_allowed !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields: user_id, page_path, is_allowed' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('page_access')
      .upsert(
        {
          user_id,
          page_path,
          is_allowed,
          dikemaskini_pada: new Date().toISOString(),
        },
        { onConflict: 'user_id,page_path' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}

// DELETE: remove page override (revert back to default access)
export async function DELETE(request: NextRequest) {
  const { supabase, isSuperadmin } = await verifySuperadmin()
  if (!isSuperadmin) {
    return NextResponse.json({ error: 'Unauthorized: Superadmin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const pagePath = searchParams.get('page_path')

    if (!userId || !pagePath) {
      return NextResponse.json({ error: 'user_id and page_path query params required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('page_access')
      .delete()
      .eq('user_id', userId)
      .eq('page_path', pagePath)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Override removed' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete override' }, { status: 500 })
  }
}
