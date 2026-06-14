import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteClientInBodyEntry } from '@/lib/db'

// DELETE /api/clients/[id]/inbody/[entryId] — remove one of a client's measurements
export async function DELETE(_: Request, { params }: { params: { id: string; entryId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const ok = await deleteClientInBodyEntry(session.user.id, params.id, params.entryId)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('delete client inbody error', error)
    return NextResponse.json({ error: 'Failed to delete measurement' }, { status: 500 })
  }
}
