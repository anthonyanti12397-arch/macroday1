import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Admin emails that are allowed to export user data
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  // Add more admin emails here
].filter(Boolean)

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only allow admin emails
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const format = req.nextUrl.searchParams.get('format') || 'json'
    const includeDetails = req.nextUrl.searchParams.get('details') === 'true'

    // Fetch all users with emails
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        isPro: includeDetails,
        isAdFree: includeDetails,
        subscriptionStatus: includeDetails,
        stripeCustomerId: includeDetails,
      },
      orderBy: { createdAt: 'desc' },
    })

    const filtered = users.filter(u => u.email)

    // CSV format for easy import into email tools
    if (format === 'csv') {
      const headers = includeDetails
        ? ['email', 'name', 'created_at', 'is_pro', 'is_ad_free', 'subscription_status']
        : ['email', 'name', 'created_at']

      const rows = filtered.map(u => {
        const base = [
          u.email ?? '',
          u.name ?? '',
          u.createdAt.toISOString().split('T')[0],
        ]
        if (includeDetails) {
          base.push(
            String((u as any).isPro ?? false),
            String((u as any).isAdFree ?? false),
            (u as any).subscriptionStatus ?? 'free'
          )
        }
        return base.map(v => `"${v.replace(/"/g, '""')}"`).join(',')
      })

      const csv = [headers.join(','), ...rows].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="macroday-users-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format (default)
    return NextResponse.json({
      total: filtered.length,
      exportedAt: new Date().toISOString(),
      users: filtered.map(u => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
        ...(includeDetails && {
          isPro: (u as any).isPro,
          isAdFree: (u as any).isAdFree,
          subscriptionStatus: (u as any).subscriptionStatus,
        }),
      })),
    })
  } catch (error) {
    console.error('[Admin Export Emails] Error:', error)
    return NextResponse.json({ error: 'Failed to export emails' }, { status: 500 })
  }
}
