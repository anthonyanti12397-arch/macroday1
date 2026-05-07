import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/friends/list — returns friends + pending requests
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const uid = session.user.id

  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: uid },
      include: { addressee: { select: { id: true, name: true, image: true, email: true, streak: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: uid },
      include: { requester: { select: { id: true, name: true, image: true, email: true, streak: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  type SentItem = typeof sent[number]
  type ReceivedItem = typeof received[number]

  const friends = [
    ...sent.filter((f: SentItem) => f.status === 'accepted').map((f: SentItem) => ({ ...f.addressee, friendshipId: f.id })),
    ...received.filter((f: ReceivedItem) => f.status === 'accepted').map((f: ReceivedItem) => ({ ...f.requester, friendshipId: f.id })),
  ]

  const pendingReceived = received.filter((f: ReceivedItem) => f.status === 'pending').map((f: ReceivedItem) => ({
    friendshipId: f.id,
    user: f.requester,
    createdAt: f.createdAt,
  }))

  const pendingSent = sent.filter((f: SentItem) => f.status === 'pending').map((f: SentItem) => ({
    friendshipId: f.id,
    user: f.addressee,
    createdAt: f.createdAt,
  }))

  return NextResponse.json({ friends, pendingReceived, pendingSent })
}
