import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/friends/activity — friends' recent forum posts + step logs
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const uid = session.user.id

  // Get all accepted friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: uid, status: 'accepted' },
        { addresseeId: uid, status: 'accepted' },
      ],
    },
  })

  const friendIds = friendships.map(f => f.requesterId === uid ? f.addresseeId : f.requesterId)

  if (friendIds.length === 0) return NextResponse.json({ activity: [] })

  // Get recent posts + step logs from friends
  const [posts, stepLogs] = await Promise.all([
    prisma.forumPost.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.stepLog.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])

  type PostItem = typeof posts[number]
  type StepItem = typeof stepLogs[number]

  const activity = [
    ...posts.map((p: PostItem) => ({
      type: 'post' as const,
      user: p.user,
      createdAt: p.createdAt,
      data: { content: p.content.substring(0, 120), isCheckIn: p.isCheckIn, likesCount: p.likesCount },
    })),
    ...stepLogs.map((s: StepItem) => ({
      type: 'steps' as const,
      user: s.user,
      createdAt: s.createdAt,
      data: { steps: s.steps, date: s.date },
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30)

  return NextResponse.json({ activity })
}
