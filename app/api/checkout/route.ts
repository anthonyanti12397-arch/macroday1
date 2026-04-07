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
    const { userId, mode = 'pro', amount } = await req.json()

    // Determine price based on mode
    let unitAmount = 100 // Default $1.00
    let productName = 'MacroDay Lifetime Pro'
    let productDesc = 'Unlimited meals, historical charts, and full recipe access.'

    if (mode === 'donate' && amount) {
      unitAmount = Math.round(amount * 100) // amount in USD to cents
      productName = 'MacroDay Donation'
      productDesc = 'Support the developer and future MacroDay updates ❤️'
    }

    // Create Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: mode === 'donate' 
        ? `${process.env.NEXTAUTH_URL}/?donated=true`
        : `${process.env.NEXTAUTH_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/`,
      metadata: {
        userId,
        mode,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
