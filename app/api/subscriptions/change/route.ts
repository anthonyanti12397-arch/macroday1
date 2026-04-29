import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscriptionStatus, setUserSubscription, logSubscriptionHistory } from '@/lib/db'
import { createErrorResponse, logApiError, stripeApiCall, isRetryableError } from '@/lib/api-utils'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Map plan names to Stripe price IDs
const PLAN_PRICES: Record<string, string> = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
  adfree: process.env.NEXT_PUBLIC_STRIPE_ADFREE_PRICE_ID || 'price_adfree',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.id) {
      return createErrorResponse('Not authenticated', 401, 'AUTH_REQUIRED')
    }

    const { newPlan } = (await req.json()) as { newPlan?: string }
    if (!newPlan || !['pro', 'adfree', 'free'].includes(newPlan)) {
      return createErrorResponse('Invalid plan requested', 400, 'INVALID_PLAN', { newPlan })
    }

    const userId = session.user.id
    const subStatus = await getSubscriptionStatus(userId)

    if (!subStatus) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    const currentPlan = subStatus.isPro ? 'pro' : subStatus.isAdFree ? 'adfree' : 'free'

    // If switching to free (cancel), use cancel endpoint instead
    if (newPlan === 'free') {
      return createErrorResponse('Use POST /api/subscriptions/cancel to cancel subscription', 400, 'USE_CANCEL_ENDPOINT')
    }

    // If already on this plan, no change needed
    if (currentPlan === newPlan) {
      return createErrorResponse(`Already subscribed to ${newPlan}`, 400, 'PLAN_UNCHANGED')
    }

    let response: Record<string, any>

    if (currentPlan === 'free') {
      // Free → Paid: Create new subscription
      const priceId = PLAN_PRICES[newPlan]
      if (!priceId) {
        logApiError('[Subscriptions Change] Price not configured', new Error(`Missing price ID for ${newPlan}`), { newPlan })
        return createErrorResponse(`Price not configured for ${newPlan}`, 500, 'PRICE_NOT_CONFIGURED')
      }

      // Need to create Stripe customer if not exists
      let customerId = subStatus.stripeCustomerId
      if (!customerId) {
        const customer = await stripeApiCall(
          () => stripe.customers.create({
            email: session.user.email || undefined,
            name: session.user.name || undefined,
          }),
          'customers.create'
        )
        customerId = customer.id

        // Update user with customer ID
        await setUserSubscription(userId, {
          stripeCustomerId: customerId,
        })
      }

      // Create new subscription
      const subscription = await stripeApiCall(
        () => stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
        }),
        'subscriptions.create'
      )

      console.log('[Subscriptions Change] Free → Paid subscription created:', {
        userId,
        plan: newPlan,
        subscriptionId: subscription.id,
      })

      // Update user database
      const isPro = newPlan === 'pro'
      const isAdFree = newPlan === 'adfree'
      const trialEnd = isPro ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null

      await setUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: isPro ? 'trial' : 'active',
        isPro,
        isAdFree,
        proTrialEndsAt: trialEnd,
      })
      await logSubscriptionHistory(userId, 'free', newPlan, subscription.id)

      response = {
        ok: true,
        subscription: subscription.id,
        plan: newPlan,
        status: isPro ? 'trial' : 'active',
      }
    } else {
      // Paid → Paid: Update existing subscription (proration handled by Stripe)
      if (!subStatus.stripeSubscriptionId) {
        return createErrorResponse('No active subscription found', 404, 'NO_SUBSCRIPTION')
      }

      const priceId = PLAN_PRICES[newPlan]
      if (!priceId) {
        logApiError('[Subscriptions Change] Price not configured', new Error(`Missing price ID for ${newPlan}`), { newPlan })
        return createErrorResponse(`Price not configured for ${newPlan}`, 500, 'PRICE_NOT_CONFIGURED')
      }

      // Get current subscription to modify items
      const subscription = await stripeApiCall(
        () => stripe.subscriptions.retrieve(subStatus.stripeSubscriptionId!),
        'subscriptions.retrieve'
      )
      const currentItem = subscription.items.data[0]

      // Update subscription item (Stripe handles proration)
      const updatedSubscription = await stripeApiCall(
        () => stripe.subscriptions.update(subStatus.stripeSubscriptionId!, {
          items: [
            {
              id: currentItem.id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations', // Create prorations for billing adjustments
        }),
        'subscriptions.update'
      )

      console.log('[Subscriptions Change] Plan updated with proration:', {
        userId,
        fromPlan: currentPlan,
        toPlan: newPlan,
        subscriptionId: updatedSubscription.id,
      })

      // Update user database
      const isPro = newPlan === 'pro'
      const isAdFree = newPlan === 'adfree'

      await setUserSubscription(userId, {
        isPro,
        isAdFree,
      })
      await logSubscriptionHistory(userId, currentPlan, newPlan, updatedSubscription.id)

      response = {
        ok: true,
        subscription: updatedSubscription.id,
        plan: newPlan,
        status: 'active',
        message: 'Plan updated. Prorations will be applied to your next invoice.',
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    logApiError('[Subscriptions Change] Failed to change subscription', error, { userId: session?.user?.id })
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)), 500, 'SUBSCRIPTION_CHANGE_ERROR')
  }
}
