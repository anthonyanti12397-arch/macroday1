import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/friends/request — send a friend request by email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { email } = await req.json() as { email?: string }
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const addressee = await prisma.user.findUnique({ where: { email } })
  if (!addressee) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (addressee.id === session.user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  // Check if friendship already exists in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: session.user.id },
      ],
    },
  })
  if (existing) {
    if (existing.status === 'accepted') return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    if (existing.status === 'pending') return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: session.user.id,
      addresseeId: addressee.id,
      status: 'pending',
    },
  })

  return NextResponse.json({ success: true, friendship })
}
