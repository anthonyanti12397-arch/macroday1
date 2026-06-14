import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listClients, createClient } from '@/lib/db'

// GET /api/clients — list the coach's clients (each with latest measurement)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const clients = await listClients(session.user.id)
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('list clients error', error)
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }
}

// POST /api/clients — create a client { name, contact?, gender?, notes? }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await req.json()) as { name?: string; contact?: string; gender?: string; notes?: string }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }
    const client = await createClient(session.user.id, {
      name: body.name,
      contact: body.contact,
      gender: body.gender,
      notes: body.notes,
    })
    return NextResponse.json({ client })
  } catch (error) {
    console.error('create client error', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
