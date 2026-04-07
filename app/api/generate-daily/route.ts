import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { InBodyRecord, UserProfile, DailyMeals, Meal } from '@/lib/types'
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

function calcTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = estimateBMR(inbody)
  const muscle = inbody.skeletalMuscleMass
  let targetCalories: number, targetProtein: number
  switch (goal) {
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
  return { targetCalories, targetProtein }
}

function fixMacros(meal: Meal): Meal {
  const calculated = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
  return { ...meal, calories: calculated }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { inbody: InBodyRecord; profile: UserProfile; lang?: string }
    const { inbody, profile, lang = 'zh' } = body
    const isChinese = lang === 'zh'
    const { targetCalories, targetProtein } = calcTargets(inbody, profile.goal)

    const restrictions = profile.dietaryRestrictions.length > 0
      ? profile.dietaryRestrictions.join(', ') : 'None'
    const proteins = profile.proteinPreferences.length > 0
      ? profile.proteinPreferences.join(', ') : 'any'
    const carbs = profile.carbPreferences.length > 0
      ? profile.carbPreferences.join(', ') : 'any'
    const cuisines = (profile.cuisinePreferences ?? []).length > 0
      ? profile.cuisinePreferences.join(', ') : 'any'

    const cookingStyleMap = {
      home: isChinese
        ? '用戶自己在家煮食。提供完整繁體中文食譜。'
        : 'User cooks at home. Provide full recipes in English.',
      takeout: isChinese
        ? '用戶常吃外賣。推薦香港本地常見餐廳菜式（如：茶餐廳、麥當勞、吉野家等）。isTakeout: true。'
        : 'User eats takeout. Recommend real-world restaurant dishes. isTakeout: true.',
      both: isChinese
        ? '混合：早餐在家，午餐外賣（香港特色），晚餐在家。'
        : 'Mix: Breakfast/Dinner at home, Lunch is takeout.',
    }
    const cookingInstruction = cookingStyleMap[profile.cookingStyle]

    const namingInstruction = isChinese
      ? '- 所有內容使用繁體中文\n- whereToGet 填寫具體類型（如「港式茶餐廳」、「健康沙拉店」）'
      : '- Use English for all content\n- be specific about dish names'

    const userPrompt = `Generate today's 3 meals (breakfast, lunch, dinner) for a gym user.
    
    Goal: ${profile.goal}
    Targets: ${targetCalories} kcal | ${targetProtein}g Protein.
    Preferences: ${proteins} proteins, ${carbs} carbs.
    Style: ${cookingInstruction}
    
    DIVERSITY & ACCURACY:
    - No duplicate main ingredients in one day.
    - Reference: 100g Chicken = 31g P, 100g Rice = 28g C.
    - If user is ZH/HK, focus on local dishes (Steamed Fish, Dim Sum options, etc).

    Return ONLY a JSON object:
    {
      "breakfast": { "name": "", "imagePrompt": "", "cookingTime": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
      "lunch": { ... },
      "dinner": { ... }
    }
    ${namingInstruction}`

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 1800,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a sports nutritionist. Generate precise meal recommendations in JSON. No markdown.',
        },
        { role: 'user', content: userPrompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as {
      breakfast: Meal
      lunch: Meal
      dinner: Meal
    }

    const result: DailyMeals = {
      date: new Date().toISOString().split('T')[0],
      breakfast: fixMacros(parsed.breakfast),
      lunch: fixMacros(parsed.lunch),
      dinner: fixMacros(parsed.dinner),
      targetCalories,
      targetProtein,
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
