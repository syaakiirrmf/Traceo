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
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

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
