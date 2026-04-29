import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscriptionStatus, setUserSubscription, logSubscriptionHistory } from '@/lib/db'
import { createErrorResponse, logApiError, stripeApiCall } from '@/lib/api-utils'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.id) {
      return createErrorResponse('Not authenticated', 401, 'AUTH_REQUIRED')
    }

    const userId = session.user.id
    const subStatus = await getSubscriptionStatus(userId)

    if (!subStatus || !subStatus.stripeSubscriptionId) {
      return createErrorResponse('No active subscription found', 404, 'NO_SUBSCRIPTION')
    }

    // Cancel the Stripe subscription at period end (user keeps access until renewal date)
    const updatedSubscription = await stripeApiCall(
      () => stripe.subscriptions.update(subStatus.stripeSubscriptionId!, {
        cancel_at_period_end: true,
      }),
      'subscriptions.update'
    )

    console.log('[Subscriptions Cancel] Subscription cancelled at period end:', {
      userId,
      subscriptionId: updatedSubscription.id,
      cancelAt: updatedSubscription.cancel_at,
    })

    // Update local database
    const fromPlan = subStatus.isPro ? 'pro' : subStatus.isAdFree ? 'adfree' : 'free'
    await setUserSubscription(userId, {
      subscriptionStatus: 'canceled',
    })
    await logSubscriptionHistory(userId, fromPlan, 'free', updatedSubscription.id)

    const currentPeriodEnd = (updatedSubscription as any).current_period_end || updatedSubscription.cancel_at || Math.floor(Date.now() / 1000)
    return NextResponse.json(
      {
        ok: true,
        message: 'Subscription will be canceled at the end of the billing period',
        cancelAt: new Date(updatedSubscription.cancel_at! * 1000).toISOString(),
        lastChargeDate: new Date(currentPeriodEnd * 1000).toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    logApiError('[Subscriptions Cancel] Failed to cancel subscription', error, { userId: session?.user?.id })
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)), 500, 'SUBSCRIPTION_CANCEL_ERROR')
  }
}
