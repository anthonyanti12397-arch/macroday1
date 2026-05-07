import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/steps/log — log or update steps for a day
// body: { date: 'YYYY-MM-DD', steps: number, source?: 'manual'|'healthkit'|'googlefit' }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { date, steps, source = 'manual' } = await req.json() as {
    date?: string
    steps?: number
    source?: string
  }

  if (!date || typeof steps !== 'number' || steps < 0) {
    return NextResponse.json({ error: 'date and steps required' }, { status: 400 })
  }

  const entry = await prisma.stepLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    update: { steps, source },
    create: { userId: session.user.id, date, steps, source },
  })

  return NextResponse.json({ success: true, entry })
}
