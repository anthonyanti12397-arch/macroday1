import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setUserProStatus, setUserAdFreeStatus, getUserById, setUserSubscription, logSubscriptionHistory } from '@/lib/db'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const { sessionId } = (await req.json()) as { sessionId?: string }
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    // Retrieve and verify the Stripe checkout session
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    // Must be paid or have a free trial
    const paymentOk =
      checkout.payment_status === 'paid' ||
      checkout.status === 'complete' ||
      (checkout.subscription != null) // subscription created = trial started

    if (!paymentOk) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    const mode = checkout.metadata?.mode as 'pro' | 'adfree' | 'donate' | undefined
    const isAdFree = mode === 'adfree'

    // Resolve which user to unlock:
    // 1. Currently authenticated user (most reliable)
    // 2. userId from Stripe session metadata (fallback for guests who paid)
    const session = await getServerSession(authOptions)
    let userId = session?.user?.id

    if (!userId) {
      const metaUserId = checkout.metadata?.userId
      if (metaUserId && metaUserId !== 'guest') {
        // Verify this is a real user in our DB
        const dbUser = await getUserById(metaUserId)
        if (dbUser) userId = dbUser.id
      }
    }

    if (!userId) {
      console.error('[Checkout Confirm] Could not identify user for session:', {
        sessionId,
        metaUserId: checkout.metadata?.userId,
        sessionUserId: session?.user?.id,
        paymentStatus: checkout.payment_status,
      })
      return NextResponse.json({ error: 'Could not identify user' }, { status: 401 })
    }

    // Extract Stripe customer ID from session
    const stripeCustomerId = checkout.customer as string | null

    if (isAdFree) {
      // Store subscription data for Ad-Free plan
      if (stripeCustomerId) {
        const subscription = checkout.subscription as Stripe.Subscription | null
        await setUserSubscription(userId, {
          stripeCustomerId,
          stripeSubscriptionId: subscription?.id,
          subscriptionStatus: 'active',
          isAdFree: true,
        })
        await logSubscriptionHistory(userId, 'free', 'adfree', subscription?.id)
      } else {
        await setUserAdFreeStatus(userId, true)
      }
      console.log('[Checkout Confirm] Ad-Free upgrade successful', { userId, mode, stripeCustomerId })
      return NextResponse.json({ ok: true, isAdFree: true })
    } else {
      const subscription = checkout.subscription as Stripe.Subscription | null
      const trialEnd =
        subscription?.trial_end != null ? new Date(subscription.trial_end * 1000) : null

      // Store subscription data for Pro plan
      if (stripeCustomerId && subscription) {
        await setUserSubscription(userId, {
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'trial',
          isPro: true,
          proTrialEndsAt: trialEnd,
        })
        await logSubscriptionHistory(userId, 'free', 'pro', subscription.id)
      } else {
        await setUserProStatus(userId, true, trialEnd)
      }

      console.log('[Checkout Confirm] Pro upgrade successful', { userId, mode, trialEnd, stripeCustomerId, subscriptionId: subscription?.id })
      return NextResponse.json({ ok: true, isPro: true })
    }
  } catch (error) {
    console.error('[Checkout Confirm] Error:', error instanceof Error ? error.message : String(error), {
      sessionId: (error as any)?.sessionId,
    })
    return NextResponse.json({ error: 'Failed to confirm checkout' }, { status: 500 })
  }
}
