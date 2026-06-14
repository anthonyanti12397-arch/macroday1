import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateClient, deleteClient } from '@/lib/db'

// PATCH /api/clients/[id] — rename / edit a client
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await req.json()) as { name?: string; contact?: string; gender?: string; notes?: string }
    const ok = await updateClient(session.user.id, params.id, body)
    if (!ok) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('update client error', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] — remove a client (cascades their InBody entries)
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const ok = await deleteClient(session.user.id, params.id)
    if (!ok) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('delete client error', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
