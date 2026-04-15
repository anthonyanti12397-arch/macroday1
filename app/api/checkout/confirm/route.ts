import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setUserProStatus, setUserAdFreeStatus } from '@/lib/db'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  try {
    const { sessionId } = (await req.json()) as { sessionId?: string }
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    const mode = checkout.metadata?.mode as 'pro' | 'adfree' | 'donate' | undefined
    const isPro = mode === 'pro' || !mode // default to pro for legacy
    const isAdFree = mode === 'adfree'

    if (isAdFree) {
      await setUserAdFreeStatus(session.user.id, true)
      return NextResponse.json({ ok: true, isAdFree: true })
    } else {
      const subscription = checkout.subscription as Stripe.Subscription | null
      const trialEnd =
        subscription?.trial_end != null ? new Date(subscription.trial_end * 1000) : null

      await setUserProStatus(session.user.id, true, trialEnd)
      return NextResponse.json({ ok: true, isPro: true })
    }
  } catch (error) {
    console.error('checkout confirm error', error)
    return NextResponse.json({ error: 'Failed to confirm checkout' }, { status: 500 })
  }
}
