import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/steps/leaderboard — weekly steps ranking among friends + self
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const uid = session.user.id

  // Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: uid, status: 'accepted' },
        { addresseeId: uid, status: 'accepted' },
      ],
    },
  })
  const friendIds = friendships.map(f => f.requesterId === uid ? f.addresseeId : f.requesterId)
  const participantIds = [uid, ...friendIds]

  // Current week: Monday to today
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // Mon=1 ... Sun=7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  const logs = await prisma.stepLog.findMany({
    where: {
      userId: { in: participantIds },
      date: { gte: weekStart, lte: today },
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  })

  // Aggregate by user
  const byUser: Record<string, { user: { id: string; name: string | null; image: string | null }; steps: number }> = {}
  for (const log of logs) {
    if (!byUser[log.userId]) byUser[log.userId] = { user: log.user, steps: 0 }
    byUser[log.userId].steps += log.steps
  }

  // Include users with 0 steps
  const users = await prisma.user.findMany({
    where: { id: { in: participantIds } },
    select: { id: true, name: true, image: true },
  })
  for (const u of users) {
    if (!byUser[u.id]) byUser[u.id] = { user: u, steps: 0 }
  }

  const leaderboard = Object.values(byUser)
    .sort((a, b) => b.steps - a.steps)
    .map((entry, idx) => ({ rank: idx + 1, ...entry, isMe: entry.user.id === uid }))

  return NextResponse.json({ leaderboard, weekStart, today })
}
