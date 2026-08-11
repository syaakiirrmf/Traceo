import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateKronologiDocx } from '@/lib/actions/kronologi'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, peranan')
      .eq('auth_id', authUser.id)
      .single()

    if (!userProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    // Pegawai Susulan assignment check
    if (userProfile.peranan === 'pegawai_susulan') {
      const { data: assignment } = await supabase
        .from('fasiliti_pegawai')
        .select('fasiliti_id')
        .eq('fasiliti_id', id)
        .eq('user_id', userProfile.id)
        .maybeSingle()
      if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = await generateKronologiDocx(id)

    // Get fasiliti kod for filename
    const { data: fasiliti } = await supabase
      .from('fasiliti')
      .select('kod_rujukan')
      .eq('id', id)
      .single()

    const today = format(new Date(), 'ddMMyyyy')
    const kod = (fasiliti?.kod_rujukan ?? 'JV').replace('-', '')
    const filename = `KRONOLOGI_${kod}_${today}.docx`

    // Audit log
    if (userProfile) {
      await supabase.from('log_audit').insert({
        user_id: userProfile.id,
        tindakan: 'jana_kronologi',
        entiti_jenis: 'fasiliti',
        entiti_id: id,
        butiran: { format: 'docx', filename },
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Kronologi Export Error]', error)
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}
