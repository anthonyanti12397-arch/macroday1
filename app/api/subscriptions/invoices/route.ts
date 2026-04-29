import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscriptionStatus, getSubscriptionInvoices } from '@/lib/db'
import { createErrorResponse, logApiError, stripeApiCall } from '@/lib/api-utils'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.id) {
      return createErrorResponse('Not authenticated', 401, 'AUTH_REQUIRED')
    }

    const userId = session.user.id
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100)

    const subStatus = await getSubscriptionStatus(userId)

    if (!subStatus?.stripeCustomerId) {
      // No Stripe customer - return empty list
      return NextResponse.json(
        {
          invoices: [],
          total: 0,
        },
        { status: 200 }
      )
    }

    // Fetch invoices from Stripe with retry logic
    try {
      const invoices = await stripeApiCall(
        () => stripe.invoices.list({
          customer: subStatus.stripeCustomerId!,
          limit,
        }),
        'invoices.list'
      )

      const formattedInvoices = invoices.data.map((invoice) => {
        const paidAt = (invoice as any).paid_at ? new Date((invoice as any).paid_at * 1000).toISOString() : null
        return {
          id: invoice.id,
          amount: invoice.amount_paid || invoice.amount_due || 0,
          currency: invoice.currency,
          status: invoice.status,
          paidAt,
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          description: invoice.description || (invoice.lines.data[0] as any)?.description || 'Subscription invoice',
          pdf_url: invoice.invoice_pdf,
        }
      })

      return NextResponse.json(
        {
          invoices: formattedInvoices,
          total: invoices.data.length,
        },
        { status: 200 }
      )
    } catch (error) {
      logApiError('[Subscriptions Invoices] Stripe fetch failed, falling back to local database', error, { userId, stripeCustomerId: subStatus.stripeCustomerId })
      // Fallback to local database
      const localInvoices = await getSubscriptionInvoices(userId, limit)
      return NextResponse.json(
        {
          invoices: localInvoices.map((inv) => ({
            id: inv.stripeInvoiceId,
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
            paidAt: inv.paidAt?.toISOString() || null,
            dueDate: inv.dueDate?.toISOString() || null,
            description: inv.description || 'Invoice',
          })),
          total: localInvoices.length,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    logApiError('[Subscriptions Invoices] Unexpected error', error, { userId: session?.user?.id })
    return createErrorResponse(error instanceof Error ? error : new Error(String(error)), 500, 'INVOICES_FETCH_ERROR')
  }
}
