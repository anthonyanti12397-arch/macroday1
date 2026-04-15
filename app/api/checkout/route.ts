import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PRO_PRICE_MONTHLY, PRO_TRIAL_DAYS } from '@/lib/constants'

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
    const session = await getServerSession(authOptions)
    const { userId, mode = 'pro', amount } = (await req.json()) as {
      userId?: string
      mode?: 'pro' | 'donate' | 'adfree'
      amount?: number
    }

    const effectiveUserId = session?.user?.id ?? userId ?? 'guest'
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    if (mode === 'donate' && amount) {
      const checkout = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'MacroDay Donation',
                description: 'Support the developer and future MacroDay updates',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/?donated=true`,
        cancel_url: `${baseUrl}/`,
        metadata: {
          userId: effectiveUserId,
          mode,
        },
      })

      return NextResponse.json({ url: checkout.url })
    }

    let lineItem: any
    const priceId = mode === 'adfree' ? process.env.STRIPE_ADFREE_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID

    if (priceId) {
      lineItem = { price: priceId, quantity: 1 }
    } else {
      const isAdFree = mode === 'adfree'
      lineItem = {
        price_data: {
          currency: isAdFree ? 'hkd' : 'usd',
          product_data: {
            name: isAdFree ? 'MacroDay Ad-Free' : 'MacroDay Pro',
            description: isAdFree 
              ? 'Permanently remove all display ads while keeping rewarded rewards.'
              : 'Regional meal plans, cloud sync, forum posting, and unlimited AI swaps.',
          },
          recurring: { interval: 'month' as const },
          unit_amount: isAdFree ? 800 : (PRO_PRICE_MONTHLY * 100),
        },
        quantity: 1,
      }
    }

    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: mode === 'adfree' ? 0 : PRO_TRIAL_DAYS,
        metadata: {
          userId: effectiveUserId,
          mode,
        },
      },
      success_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId: effectiveUserId,
        mode,
      },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err: unknown) {
    console.error('Stripe Error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Stripe error' }, { status: 500 })
  }
}
