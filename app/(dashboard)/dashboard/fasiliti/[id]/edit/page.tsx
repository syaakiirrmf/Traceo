import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { EditFasilitiForm } from './EditFasilitiForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Facility' }

export default async function EditFasilitiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, peranan')
    .eq('auth_id', authUser.id)
    .single()

  if (!userProfile || !hasPermission(userProfile.peranan, 'edit_fasiliti')) {
    redirect('/dashboard/fasiliti')
  }

  const { data: fasiliti } = await supabase.from('fasiliti').select('*').eq('id', id).single()

  if (!fasiliti) notFound()

  // Tajuk + butang Save/Cancel disediakan oleh sticky bar dalam borang
  // (EditFasilitiForm) — tiada header pendua di sini.
  return (
    <div className="max-w-3xl">
      <EditFasilitiForm fasilitiId={id} fasiliti={fasiliti} />
    </div>
  )
}
