import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/friends/remove — unfriend
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { friendshipId } = await req.json() as { friendshipId?: string }
  if (!friendshipId) return NextResponse.json({ error: 'friendshipId required' }, { status: 400 })

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } })
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (friendship.requesterId !== session.user.id && friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.friendship.delete({ where: { id: friendshipId } })
  return NextResponse.json({ success: true })
}
