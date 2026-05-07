import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/friends/respond — accept or decline a friend request
// body: { friendshipId: string, action: 'accept' | 'decline' }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { friendshipId, action } = await req.json() as { friendshipId?: string; action?: 'accept' | 'decline' }
  if (!friendshipId || !action) return NextResponse.json({ error: 'friendshipId and action required' }, { status: 400 })

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } })
  if (!friendship) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (friendship.addresseeId !== session.user.id) return NextResponse.json({ error: 'Not your request' }, { status: 403 })
  if (friendship.status !== 'pending') return NextResponse.json({ error: 'Request already handled' }, { status: 409 })

  if (action === 'accept') {
    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    })
    return NextResponse.json({ success: true, friendship: updated })
  } else {
    await prisma.friendship.delete({ where: { id: friendshipId } })
    return NextResponse.json({ success: true })
  }
}
