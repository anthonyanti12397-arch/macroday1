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

/** Recalculate calories from macros — always authoritative over the AI's stated value */
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
        ? '用戶自己在家煮食。提供完整家常食譜，包含食材清單和烹飪步驟。所有餐點 isTakeout 設為 false。'
        : 'The user cooks at home. Provide full home-cooked recipes with ingredients and step-by-step cooking instructions. Set isTakeout to false for all meals.',
      takeout: isChinese
        ? '用戶只吃外賣。推薦在香港常見餐廳、快餐店或便利店容易買到的菜式（如茶餐廳、麥當勞、7-Eleven）。所有餐點 isTakeout 設為 true，whereToGet 填寫購買地點。ingredients 和 steps 留空。'
        : 'The user eats takeout only. Suggest real dishes easily available at common restaurants. Set isTakeout to true, fill whereToGet. Keep ingredients and steps empty.',
      both: isChinese
        ? '混合：早餐為簡單家常菜（isTakeout: false），午餐為外賣（isTakeout: true，填 whereToGet），晚餐為家常菜（isTakeout: false）。'
        : 'Mix: breakfast = simple home-cooked (isTakeout: false), lunch = takeout (isTakeout: true, fill whereToGet), dinner = home-cooked (isTakeout: false).',
    }
    const cookingInstruction = cookingStyleMap[profile.cookingStyle]

    const namingInstruction = isChinese
      ? '- 所有菜名必須使用繁體中文（例如「照燒三文魚飯」而非 "Teriyaki Salmon Rice"）\n- 食材名稱和烹飪步驟也必須使用繁體中文\n- whereToGet 也用中文填寫（例如「茶餐廳」、「麥當勞」）'
      : '- Meal names should be specific and appetising (e.g. "Teriyaki Salmon Rice Bowl")\n- Use English for all names and instructions'

    const userPrompt = `Generate today's 3 meals (breakfast, lunch, dinner) for a gym user.

Goal: ${profile.goal}
Daily calorie target: ${targetCalories} kcal
Daily protein target: ${targetProtein}g
Dietary restrictions: ${restrictions}
Preferred proteins: ${proteins}
Preferred carbs: ${carbs}
Cuisine style: ${cuisines}

Cooking style: ${cookingInstruction}

NUTRITION ACCURACY RULES (strictly follow):
- Base macros on real portion sizes. Be precise and conservative.
- Reference: 1 egg=6g P/5g F/80kcal, 100g chicken breast=31g P/3g F/165kcal, 100g rice(cooked)=3g P/28g C/130kcal, 1 slice bread=3g P/15g C/1g F/80kcal, 100g salmon=25g P/13g F/208kcal, 100g tofu=8g P/5g F/76kcal, 100g beef=26g P/15g F/250kcal, 100g pork belly=9g P/35g F/380kcal.
- DO NOT invent high protein values. A chicken-egg sandwich on 2 slices bread = ~20g protein max.
- Calories will be recalculated as (protein×4 + carbs×4 + fat×9) server-side — focus on getting macros right.

IMAGE PROMPT RULE:
- For each meal include an "imagePrompt" field: a short English visual description of the dish for food photography.
- Always in English, even if the meal name is Chinese. Be specific about ingredients and presentation.
- Example: "scrambled eggs with cherry tomatoes on sourdough toast" or "grilled chicken rice bowl with steamed broccoli and carrots"

Return ONLY a JSON object (no markdown, no extra text):
{
  "breakfast": {
    "name": "",
    "imagePrompt": "",
    "cookingTime": 0,
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "ingredients": [],
    "steps": [],
    "isTakeout": false,
    "whereToGet": ""
  },
  "lunch": { ...same structure... },
  "dinner": { ...same structure... }
}

Rules:
- Total protein across 3 meals should be close to ${targetProtein}g
- For takeout meals: ingredients=[], steps=[], whereToGet must name the type of shop/restaurant
- For home meals: whereToGet=""
${namingInstruction}`

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 1800,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a professional sports nutritionist AI. Generate precise, realistic meal recommendations with accurate macros based on real food composition data. Respond with valid JSON only. No markdown, no explanation, no code blocks.',
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

    // Server-side macro correction: recalculate calories from macros
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
