import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getUserById,
  getUserByStripeCustomerId,
  setUserSubscription,
  logSubscriptionHistory,
  createInvoice,
  updateInvoiceStatus,
} from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature') || ''

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (error) {
      console.error('[Stripe Webhook] Signature verification failed:', error instanceof Error ? error.message : String(error))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        // Stripe created a new customer - we'll link it when they make a purchase
        const customer = event.data.object as Stripe.Customer
        console.log('[Stripe Webhook] Customer created:', customer.id)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const plan = subscription.items.data[0]?.plan.nickname || 'unknown'

        console.log('[Stripe Webhook] Subscription created:', { subscriptionId: subscription.id, customerId, plan })

        // Find user by stripeCustomerId and update
        // Note: In real implementation, we'd need to find user by customerId
        // For now, the checkout/confirm already handles this
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('[Stripe Webhook] Subscription updated:', { subscriptionId: subscription.id, customerId, status: subscription.status })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('[Stripe Webhook] Subscription deleted:', { subscriptionId: subscription.id, customerId })
        // Mark user subscription as canceled
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = (invoice as any).subscription as string | null

        console.log('[Stripe Webhook] Invoice payment succeeded:', { invoiceId: invoice.id, customerId, amount: invoice.amount_paid })

        try {
          // Find user by Stripe customer ID
          const user = await getUserByStripeCustomerId(customerId)
          if (user) {
            // Create invoice record
            await createInvoice({
              userId: user.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid || 0,
              currency: invoice.currency || 'usd',
              status: 'paid',
              paidAt: (invoice as any).paid_at ? new Date((invoice as any).paid_at * 1000) : new Date(),
              description: invoice.description || `Subscription invoice for ${subscriptionId || 'MacroDay'}`,
            })
            console.log('[Stripe Webhook] Invoice record created in database:', { userId: user.id, invoiceId: invoice.id })
          } else {
            console.warn('[Stripe Webhook] Could not find user for Stripe customer:', customerId)
          }
        } catch (error) {
          console.error('[Stripe Webhook] Error creating invoice record:', error instanceof Error ? error.message : String(error))
          // Don't throw - webhook processing should continue even if invoice logging fails
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('[Stripe Webhook] Invoice payment failed:', { invoiceId: invoice.id, customerId })
        // Mark subscription as past_due and notify user
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
