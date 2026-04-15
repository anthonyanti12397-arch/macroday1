import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createForumReply } from '@/lib/db'
import { canUseFeature } from '@/lib/featureGate'

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canUseFeature('forum-reply', { isPro: session.user.isPro })) {
    return NextResponse.json({ error: 'Pro required to reply without limits' }, { status: 403 })
  }

  try {
    const { content } = (await req.json()) as { content?: string }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 })
    }

    const reply = await createForumReply(params.postId, session.user.id, content.trim())
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('forum reply error', error)
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
  }
}
