import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

/**
 * Permanent account deletion.
 *
 * App Store guideline 5.1.1(v) requires any app that supports account creation
 * to offer account deletion from within the app — this is the endpoint behind
 * that. Our privacy policy also promises deletion on request.
 *
 * Every relation in schema.prisma is onDelete: Cascade, so removing the User row
 * removes InBody entries, meal plans, forum posts/replies/likes, friendships,
 * step logs, auth accounts, and billing records with it.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Cancel any live Stripe subscription first — deleting the row locally would
    // otherwise leave the subscription billing against a user that no longer exists.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    })

    if (user?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.subscriptions.cancel(user.stripeSubscriptionId)
      } catch (err) {
        // Already cancelled / missing in Stripe — proceed with deletion anyway.
        console.warn('[Account Delete] Stripe cancel failed (continuing):', err)
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    console.log('[Account Delete] Deleted user', userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Account Delete] Failed:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
