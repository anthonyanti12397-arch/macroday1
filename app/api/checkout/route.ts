import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL, PRO_CURRENCY, PRO_TRIAL_DAYS } from '@/lib/constants'

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
    const { mode = 'pro', amount, interval = 'month' } = (await req.json()) as {
      userId?: string
      mode?: 'pro' | 'donate' | 'adfree'
      amount?: number
      interval?: 'month' | 'year'
    }
    const billing: 'month' | 'year' = interval === 'year' ? 'year' : 'month'

    // 要求身份验证 (除了捐赠模式外)
    if (mode !== 'donate' && !session?.user?.id) {
      console.warn('[Checkout] Unauthenticated user attempting to upgrade to', mode)
      return NextResponse.json({ error: 'Authentication required', requiresAuth: true }, { status: 401 })
    }

    const effectiveUserId = session?.user?.id || 'guest'
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    console.log('[Checkout] Creating checkout session', { userId: effectiveUserId, mode })

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
    const isAdFree = mode === 'adfree'
    // Prefer pre-created Stripe price IDs when configured; otherwise fall back to
    // inline price_data so pricing works without any Stripe dashboard setup.
    const priceId = isAdFree
      ? process.env.STRIPE_ADFREE_PRICE_ID
      : billing === 'year'
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID

    if (priceId) {
      lineItem = { price: priceId, quantity: 1 }
    } else if (isAdFree) {
      lineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'MacroDay Ad-Free',
            description: 'Remove all display ads while keeping rewarded quota.',
          },
          recurring: { interval: 'month' as const },
          unit_amount: PRO_PRICE_MONTHLY * 100,
        },
        quantity: 1,
      }
    } else {
      // Plus tier — monthly or annual.
      lineItem = {
        price_data: {
          currency: PRO_CURRENCY,
          product_data: {
            name: 'MacroDay Plus',
            description: 'No ads, higher daily limit, cloud sync, community, unlimited swaps, weekly plans.',
          },
          recurring: { interval: billing },
          unit_amount: (billing === 'year' ? PRO_PRICE_ANNUAL : PRO_PRICE_MONTHLY) * 100,
        },
        quantity: 1,
      }
    }

    const subscriptionData: Record<string, unknown> = {
      metadata: { userId: effectiveUserId, mode },
    }
    if (mode !== 'adfree' && PRO_TRIAL_DAYS > 0) {
      subscriptionData.trial_period_days = PRO_TRIAL_DAYS
    }

    const checkout = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'subscription',
      subscription_data: subscriptionData,
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
