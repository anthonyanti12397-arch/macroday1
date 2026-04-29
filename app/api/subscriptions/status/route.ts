import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/db'
import { createErrorResponse, logApiError, stripeApiCall, validateEnvVars } from '@/lib/api-utils'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.id) {
      return createErrorResponse('Not authenticated', 401, 'AUTH_REQUIRED')
    }

    const userId = session.user.id
    const subStatus = await getSubscriptionStatus(userId)

    if (!subStatus) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    // Default to free user
    const response: Record<string, any> = {
      status: 'free',
      plan: 'free',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
      canceledAt: null,
      nextPaymentAttempt: null,
    }

    // If user has a Stripe subscription, fetch current details
    if (subStatus.stripeSubscriptionId) {
      try {
        const subscription = await stripeApiCall(
          () => stripe.subscriptions.retrieve(subStatus.stripeSubscriptionId!, {
            expand: ['latest_invoice'],
          }),
          'subscriptions.retrieve'
        )

        response.status = subStatus.subscriptionStatus || 'active'
        response.stripeSubscriptionId = subscription.id
        const currentPeriodEnd = (subscription as any).current_period_end || subscription.cancel_at || Math.floor(Date.now() / 1000)
        response.currentPeriodEnd = new Date(currentPeriodEnd * 1000).toISOString()

        // Set plan based on subscription status and user flags
        if (subStatus.isPro) {
          response.plan = 'pro'
          response.trialEndsAt = subStatus.proTrialEndsAt?.toISOString() || null
        } else if (subStatus.isAdFree) {
          response.plan = 'adfree'
        }

        // Check if subscription is scheduled to cancel
        if (subscription.cancel_at) {
          response.canceledAt = new Date(subscription.cancel_at * 1000).toISOString()
        }

        // Next invoice/payment info
        if (subscription.latest_invoice) {
          const invoice = subscription.latest_invoice as Stripe.Invoice
          if (invoice.next_payment_attempt) {
            response.nextPaymentAttempt = new Date(invoice.next_payment_attempt * 1000).toISOString()
          }
        }
      } catch (error) {
        logApiError('[Subscriptions Status] Stripe fetch failed, using local status', error, { userId, subscriptionId: subStatus.stripeSubscriptionId })
        // Fall back to local status
        response.status = subStatus.subscriptionStatus || 'free'
        if (subStatus.isPro) {
          response.plan = 'pro'
          response.trialEndsAt = subStatus.proTrialEndsAt?.toISOString() || null
        } else if (subStatus.isAdFree) {
          response.plan = 'adfree'
        }
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    logApiError('[Subscriptions Status] Unexpected error', error, { userId: session?.user?.id })
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)), 500, 'SUBSCRIPTION_STATUS_ERROR')
  }
}
