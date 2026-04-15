import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toggleForumLike } from '@/lib/db'

export async function POST(_: Request, { params }: { params: { postId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await toggleForumLike(params.postId, session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('forum like error', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
