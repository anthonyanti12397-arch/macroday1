import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { InBodyRecord, UserProfile, Meal } from '@/lib/types'
import { GROK_MODEL } from '@/lib/constants'

function getClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

function estimateBMR(r: InBodyRecord): number {
  if (r.bmr) return r.bmr
  const base = 10 * r.weight + 6.25 * r.height - 5 * r.age
  return Math.round(r.gender === 'male' ? base + 5 : base - 161)
}

function fixMacros(meal: Meal): Meal {
  const calculated = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
  return { ...meal, calories: calculated }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      inbody: InBodyRecord
      profile: UserProfile
      mealType: 'breakfast' | 'lunch' | 'dinner'
      currentMealName: string
      lang?: string
    }
    const { inbody, profile, mealType, currentMealName, lang = 'zh' } = body
    const isChinese = lang === 'zh'

    const bmr = estimateBMR(inbody)
    const muscle = inbody.skeletalMuscleMass
    let targetCalories: number, targetProtein: number
    switch (profile.goal) {
      case 'fat_loss':
        targetCalories = Math.round(bmr * 0.85)
        targetProtein = muscle ? Math.round(muscle * 2.2) : Math.round(inbody.weight * 1.8)
        break
      case 'muscle_gain':
        targetCalories = Math.round(bmr * 1.15)
        targetProtein = muscle ? Math.round(muscle * 2.5) : Math.round(inbody.weight * 2.0)
        break
      default:
        targetCalories = Math.round(bmr * 1.0)
        targetProtein = muscle ? Math.round(muscle * 2.0) : Math.round(inbody.weight * 1.6)
    }

    const mealCalMap = { breakfast: 0.25, lunch: 0.40, dinner: 0.35 }
    const mealProtMap = { breakfast: 0.25, lunch: 0.40, dinner: 0.35 }
    const mealCal = Math.round(targetCalories * mealCalMap[mealType])
    const mealProt = Math.round(targetProtein * mealProtMap[mealType])

    const proteins = profile.proteinPreferences.length > 0 ? profile.proteinPreferences.join(', ') : 'any'
    const carbs = profile.carbPreferences.length > 0 ? profile.carbPreferences.join(', ') : 'any'

    const prompt = isChinese
      ? `為一名健身用戶生成一個替代${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}方案。
目標: ${mealCal} kcal, ${mealProt}g 蛋白質
喜好蛋白質: ${proteins}, 碳水: ${carbs}
當前要替換的餐點: ${currentMealName} (必須不同且有創意)
烹飪方式: ${profile.cookingStyle}
目標: ${profile.goal}

只返回JSON（無markdown）:
{"name":"","imagePrompt":"","cookingTime":0,"protein":0,"carbs":0,"fat":0,"ingredients":[],"steps":[],"isTakeout":false,"whereToGet":""}`
      : `Generate an alternative ${mealType} for a gym user.
Target: ${mealCal} kcal, ${mealProt}g Protein
Protein prefs: ${proteins}, Carb prefs: ${carbs}
Replace: ${currentMealName} (must be different and creative)
Cooking style: ${profile.cookingStyle}
Goal: ${profile.goal}

Return ONLY JSON (no markdown):
{"name":"","imagePrompt":"","cookingTime":0,"protein":0,"carbs":0,"fat":0,"ingredients":[],"steps":[],"isTakeout":false,"whereToGet":""}`

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 600,
      temperature: 0.9,
      messages: [
        { role: 'system', content: 'You are a sports nutritionist. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Meal

    return NextResponse.json(fixMacros(parsed))
  } catch (err) {
    console.error('swap-meal error:', err)
    return NextResponse.json({ error: 'Failed to swap meal' }, { status: 500 })
  }
}
