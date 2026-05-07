import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/steps/history?days=30
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '7', 10)
  const limit = Math.min(days, 90) // cap at 90 days

  const logs = await prisma.stepLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: limit,
  })

  const total = logs.reduce((s: number, l: { steps: number }) => s + l.steps, 0)
  const avg = logs.length > 0 ? Math.round(total / logs.length) : 0
  const best = logs.length > 0 ? Math.max(...logs.map((l: { steps: number }) => l.steps)) : 0

  return NextResponse.json({ logs, stats: { total, avg, best, days: logs.length } })
}
