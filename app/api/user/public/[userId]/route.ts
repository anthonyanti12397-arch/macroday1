import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { WeeklyPlan } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        image: true,
        streak: true,
        mealPlans: {
          where: { planType: 'weekly' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            weekStart: true,
            targetCalories: true,
            targetProtein: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const latestPlan = user.mealPlans[0]
    const weeklyPlan = latestPlan?.payload as unknown as WeeklyPlan | undefined

    // Compute summary stats from the plan
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    const dayCount = weeklyPlan?.days?.length ?? 0

    if (weeklyPlan?.days) {
      for (const day of weeklyPlan.days) {
        totalCalories += day.totalCalories ?? 0
        totalProtein += day.totalProtein ?? 0
        totalCarbs += day.totalCarbs ?? 0
        totalFat += day.totalFat ?? 0
      }
    }

    const avgCalories = dayCount > 0 ? Math.round(totalCalories / dayCount) : 0
    const avgProtein = dayCount > 0 ? Math.round(totalProtein / dayCount) : 0
    const avgCarbs = dayCount > 0 ? Math.round(totalCarbs / dayCount) : 0
    const avgFat = dayCount > 0 ? Math.round(totalFat / dayCount) : 0

    return NextResponse.json({
      userId: user.id,
      name: user.name ?? 'MacroDay User',
      image: user.image,
      streak: user.streak ?? 0,
      weekStart: latestPlan?.weekStart ?? null,
      planCreatedAt: latestPlan?.createdAt ?? null,
      targetCalories: latestPlan?.targetCalories ?? 0,
      targetProtein: latestPlan?.targetProtein ?? 0,
      dayCount,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      // Include top meal names for display (no personal data)
      meals: weeklyPlan?.days?.slice(0, 3).map((d) => ({
        breakfast: d.breakfast?.name,
        lunch: d.lunch?.name,
        dinner: d.dinner?.name,
      })) ?? [],
    })
  } catch (error) {
    console.error('[Public User API]', error)
    return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 })
  }
}
