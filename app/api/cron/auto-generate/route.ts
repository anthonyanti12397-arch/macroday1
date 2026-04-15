import { NextRequest, NextResponse } from 'next/server'
import { getAutoGenerateUsers, getLatestInBodyRecord, saveGeneratedDailyPlan, prisma } from '@/lib/db'
import { generateDailyMealsInner } from '@/lib/ai-service'
import type { UserProfile, InBodyRecord } from '@/lib/types'

export async function GET(req: NextRequest) {
  // Security check: Only allow if a secret matches (Vercel Cron security best practice)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const users = await getAutoGenerateUsers()
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  const results = {
    total: users.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const user of users) {
    try {
      // 1. Check if plan already exists for today
      const existing = await prisma.mealPlan.findUnique({
        where: { id: `daily_${user.id}_${todayStr}` }
      })

      if (existing) {
        results.skipped++
        continue
      }

      // 2. Get latest InBody data
      const inbody = await getLatestInBodyRecord(user.id)
      if (!inbody) {
        results.skipped++
        continue
      }

      // 3. Construct profile (extract from DB fields)
      const profile: UserProfile = {
        goal: (user.goal as any) || 'maintain',
        dietaryRestrictions: (user.dietaryRestrictions as string[]) || [],
        dislikedIngredients: (user.dislikedIngredients as string[]) || [],
        preferredCuisine: (user.preferredCuisine as any) || 'Asian',
        isPro: user.isPro,
        isAdFree: user.isAdFree,
        proteinPreferences: [],
        carbPreferences: [],
        cuisinePreferences: [],
        cookingStyle: 'both'
      }

      const inbodyRecord: InBodyRecord = {
        id: inbody.id,
        date: inbody.entryDate,
        weight: inbody.weight,
        height: inbody.height,
        gender: inbody.gender as any,
        age: inbody.age,
        bodyFat: inbody.bodyFat ?? undefined,
        skeletalMuscleMass: inbody.skeletalMuscleMass ?? undefined,
        bmr: inbody.bmr ?? undefined
      }

      // 4. Generate
      const result = await generateDailyMealsInner({
        inbody: inbodyRecord,
        profile,
        lang: 'zh' // Default to zh for auto-generation
      })

      // 5. Save
      await saveGeneratedDailyPlan(user.id, result, profile, result.promptVersion ?? 'v2-regional')
      results.success++
      
    } catch (err) {
      results.failed++
      results.errors.push(`User ${user.id}: ${String(err)}`)
    }
  }

  return NextResponse.json(results)
}
