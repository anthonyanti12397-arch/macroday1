import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createForumPost, listForumPosts } from '@/lib/db'
import { canUseFeature } from '@/lib/featureGate'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const filter = (searchParams.get('filter') as 'hot' | 'mine' | 'following' | null) ?? 'hot'

  try {
    const posts = await listForumPosts(session?.user?.id, filter)
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('forum list error', error)
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canUseFeature('forum-post', { isPro: session.user.isPro })) {
    return NextResponse.json({ error: 'Pro required to post' }, { status: 403 })
  }

  try {
    const body = (await req.json()) as {
      content?: string
      mealImage?: string | null
      compliance?: number | null
      streakSnapshot?: number | null
      isCheckIn?: boolean
    }

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const post = await createForumPost({
      userId: session.user.id,
      content: body.content.trim(),
      mealImage: body.mealImage ?? null,
      compliance: body.compliance ?? null,
      streakSnapshot: body.streakSnapshot ?? null,
      isCheckIn: body.isCheckIn ?? false,
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('forum create error', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
