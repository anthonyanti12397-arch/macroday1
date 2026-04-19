import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCloudSnapshot, syncUserLocalData } from '@/lib/db'
import type { MigrationPayload } from '@/lib/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const snapshot = await getUserCloudSnapshot(session.user.id)
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('user restore error', error)
    return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = (await req.json()) as MigrationPayload
    await syncUserLocalData(session.user.id, payload)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('user sync error', error)
    return NextResponse.json({ error: 'Failed to sync user data' }, { status: 500 })
  }
}
