import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeInstance = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null

export async function POST(req: Request) {
  if (!stripeInstance) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }
  try {
    const { userId } = await req.json()

    // 1. Create Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MacroDay Lifetime Pro',
              description: 'Unlimited meals, historical charts, and full recipe access.',
            },
            unit_amount: 100, // $1.00 USD
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/`,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
