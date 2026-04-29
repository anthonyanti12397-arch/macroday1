import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import type { WeeklyPlan } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const userId = searchParams.get('userId')

  let name = 'MacroDay User'
  let streak = 0
  let avgCalories = 0
  let avgProtein = 0
  let avgCarbs = 0
  let avgFat = 0
  let weekLabel = ''

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          streak: true,
          mealPlans: {
            where: { planType: 'weekly' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (user) {
        name = user.name ?? 'MacroDay User'
        streak = user.streak ?? 0
        const plan = user.mealPlans[0]
        const weeklyPlan = plan?.payload as unknown as WeeklyPlan | undefined

        if (weeklyPlan?.days?.length) {
          const days = weeklyPlan.days
          const count = days.length
          avgCalories = Math.round(days.reduce((s, d) => s + (d.totalCalories ?? 0), 0) / count)
          avgProtein = Math.round(days.reduce((s, d) => s + (d.totalProtein ?? 0), 0) / count)
          avgCarbs = Math.round(days.reduce((s, d) => s + (d.totalCarbs ?? 0), 0) / count)
          avgFat = Math.round(days.reduce((s, d) => s + (d.totalFat ?? 0), 0) / count)
        }

        if (plan?.weekStart) {
          const d = new Date(plan.weekStart)
          weekLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }
    } catch (_) {
      // Use defaults
    }
  }

  const firstName = name.split(' ')[0]

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo + App name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🥗
          </div>
          <span style={{ color: '#a5b4fc', fontSize: '20px', fontWeight: 600, letterSpacing: '2px' }}>
            MACRODAY
          </span>
        </div>

        {/* User name + streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <h1 style={{ color: 'white', fontSize: '52px', fontWeight: 800, margin: 0 }}>
            {firstName}&apos;s Week
          </h1>
          {streak > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                borderRadius: '999px',
                padding: '8px 20px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              🔥 {streak} days
            </div>
          )}
        </div>

        {weekLabel && (
          <p style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 40px 0' }}>
            Week of {weekLabel}
          </p>
        )}

        {/* Macro grid */}
        <div style={{ display: 'flex', gap: '24px', marginTop: weekLabel ? '0' : '24px' }}>
          {[
            { label: 'Calories', value: avgCalories > 0 ? `${avgCalories}` : '—', unit: 'kcal', color: '#6366f1' },
            { label: 'Protein', value: avgProtein > 0 ? `${avgProtein}g` : '—', unit: '/day', color: '#10b981' },
            { label: 'Carbs', value: avgCarbs > 0 ? `${avgCarbs}g` : '—', unit: '/day', color: '#f59e0b' },
            { label: 'Fat', value: avgFat > 0 ? `${avgFat}g` : '—', unit: '/day', color: '#ef4444' },
          ].map((macro) => (
            <div
              key={macro.label}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${macro.color}40`,
                borderRadius: '16px',
                padding: '24px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '200px',
              }}
            >
              <div style={{ color: macro.color, fontSize: '13px', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>
                {macro.label.toUpperCase()}
              </div>
              <div style={{ color: 'white', fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                {macro.value}
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                avg {macro.unit}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '32px', color: '#374151', fontSize: '14px' }}>
          macroday1.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
