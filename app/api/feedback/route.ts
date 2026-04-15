import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { savePromptFeedback } from '@/lib/db'
import type { PromptFeedbackInput } from '@/lib/types'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as PromptFeedbackInput
    await savePromptFeedback(session.user.id, body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('feedback error', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
