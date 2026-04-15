import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canUseFeature } from '@/lib/featureGate'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canUseFeature('forum-post', { isPro: session.user.isPro })) {
    return NextResponse.json({ error: 'Pro required to upload images' }, { status: 403 })
  }

  try {
    const { fileName, contentType, base64 } = (await req.json()) as {
      fileName?: string
      contentType?: string
      base64?: string
    }

    if (!fileName || !base64) {
      return NextResponse.json({ error: 'Missing image payload' }, { status: 400 })
    }

    const buffer = Buffer.from(base64, 'base64')
    const blob = await put(`forum/${session.user.id}/${Date.now()}-${fileName}`, buffer, {
      access: 'public',
      contentType: contentType ?? 'image/jpeg',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('blob upload error', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
