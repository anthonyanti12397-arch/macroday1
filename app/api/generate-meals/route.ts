import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getServerSession } from 'next-auth'
import type { WeeklyPlan, Meal, InBodyRecord, UserProfile } from '@/lib/types'
import { GROK_MODEL } from '@/lib/constants'
import { authOptions } from '@/lib/auth'
import { saveGeneratedWeeklyPlan } from '@/lib/db'
import { getPromptVersion } from '@/lib/prompts'
import { GenerateMealsSchema } from '@/lib/validations'
import { hydrateInBodyRecord, normalizeUserProfile, formatArrayAsString } from '@/lib/objectBuilders'
import { ZodError } from 'zod'

function getClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

// Mifflin-St Jeor BMR estimate when InBody BMR is not available
function estimateBMR(inbody: InBodyRecord): number {
  if (inbody.bmr) return inbody.bmr
  const { weight, height, age, gender } = inbody
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

// Estimate protein target — use skeletal muscle mass if available, else body weight
function estimateProtein(inbody: InBodyRecord, goal: UserProfile['goal']): number {
  if (inbody.skeletalMuscleMass) {
    switch (goal) {
      case 'fat_loss':    return Math.round(inbody.skeletalMuscleMass * 2.2)
      case 'muscle_gain': return Math.round(inbody.skeletalMuscleMass * 2.5)
      default:            return Math.round(inbody.skeletalMuscleMass * 2.0)
    }
  }
  // Fallback: use body weight × factor
  switch (goal) {
    case 'fat_loss':    return Math.round(inbody.weight * 1.8)
    case 'muscle_gain': return Math.round(inbody.weight * 2.0)
    default:            return Math.round(inbody.weight * 1.6)
  }
}

function fixMacros(meal: Meal): Meal {
  const calculated = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
  return { ...meal, calories: calculated }
}

function calcTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = estimateBMR(inbody)
  const targetProtein = estimateProtein(inbody, goal)
  let targetCalories: number
  switch (goal) {
    case 'fat_loss':    targetCalories = Math.round(bmr * 0.85); break
    case 'muscle_gain': targetCalories = Math.round(bmr * 1.15); break
    default:            targetCalories = Math.round(bmr * 1.0)
  }
  return { targetCalories, targetProtein }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const rawBody = await req.json()
    const validation = GenerateMealsSchema.safeParse(rawBody)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { inbody, profile, availableIngredients = [], lang = 'zh', isTakeoutMode = false, locationContext = '' } = validation.data
    const isAuthed = !!session?.user?.id

    const inbodyWithMeta = hydrateInBodyRecord(inbody)
    const profileWithDefaults = normalizeUserProfile(profile, { isTakeoutMode, isAuthed })

    const isChinese = lang === 'zh'
    const { targetCalories, targetProtein } = calcTargets(inbodyWithMeta, profileWithDefaults.goal)

    const restrictions = formatArrayAsString(profile.dietaryRestrictions, undefined, 'None')
    const ingredients = availableIngredients.length > 0
      ? availableIngredients.join(', ')
      : 'No specific preferences'
    const cuisines = formatArrayAsString(profile.cuisinePreferences)

    // Build optional body stats context for Grok
    const statsLines = [
      `Weight: ${inbody.weight}kg`,
      `Height: ${inbody.height}cm`,
      `Age: ${inbody.age}`,
      `Gender: ${inbody.gender}`,
      inbody.bodyFat != null ? `Body fat: ${inbody.bodyFat}%` : null,
      inbody.skeletalMuscleMass != null ? `Skeletal muscle mass: ${inbody.skeletalMuscleMass}kg` : null,
      inbody.visceralFatLevel != null ? `Visceral fat level: ${inbody.visceralFatLevel}` : null,
    ].filter(Boolean).join('\n')

    const namingInstruction = isChinese
      ? '\nIMPORTANT: All meal names, ingredient names, step descriptions, shopping item names, and whereToGet values MUST be in Traditional Chinese (繁體中文). E.g. "照燒三文魚飯" not "Teriyaki Salmon Rice".'
      : '\nUse English for all names and descriptions.'

    const userPrompt = `Generate a 7-day meal plan for a gym user.
Goal: ${profile.goal}
Daily calorie target: ${targetCalories} kcal
Daily protein target: ${targetProtein}g
Dietary restrictions: ${restrictions}
Preferred ingredients: ${ingredients}
Cuisine style: ${cuisines}

Body stats:
${statsLines}

NUTRITION ACCURACY RULES (strictly follow):
- Base macros on real portion sizes. Be precise and conservative.
- Reference: 1 egg=6g P/5g F/80kcal, 100g chicken breast=31g P/3g F/165kcal, 100g rice(cooked)=3g P/28g C/130kcal, 1 slice bread=3g P/15g C/1g F/80kcal, 100g salmon=25g P/13g F/208kcal, 100g tofu=8g P/5g F/76kcal, 100g beef=26g P/15g F/250kcal.
- DO NOT invent high protein values. Focus on getting macros right — calories are recalculated server-side as (protein×4 + carbs×4 + fat×9).

IMAGE PROMPT RULE:
- Each meal must include an "imagePrompt" field: short English visual description for food photography.
- Always in English even if meal name is Chinese. Be specific about the dish.
- Example: "grilled salmon fillet on steamed jasmine rice with bok choy" or "HK-style milk tea with pineapple bun"
${namingInstruction}

${isTakeoutMode ? `TAKEOUT MODE ACTIVE (CRITICAL):
- The user is currently at or near: ${locationContext || 'Unknown Location'}.
- You MUST use your search capabilities to find REAL restaurants nearby that are available on Foodpanda or UberEats.
- For EACH meal (except snacks), set "isTakeout": true.
- Identify a REAL dish name from a REAL restaurant that matches the nutrition targets.
- Set "whereToGet" to strictly: "[Restaurant Name] - [Dish Name]". This will be used for delivery app searching.
- Set "cookingTime": 0 and "steps": ["Order via Foodpanda or UberEats"].` : ''}

Return ONLY a JSON object with this exact structure:
{
  "days": [
    {
      "date": "Monday",
      "breakfast": { "name": "", "imagePrompt": "", "cookingTime": 0, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
      "lunch": { "name": "", "imagePrompt": "", "cookingTime": 0, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
      "dinner": { "name": "", "imagePrompt": "", "cookingTime": 0, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
      "snack": { "name": "", "imagePrompt": "", "cookingTime": 0, "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
      "totalCalories": 0,
      "totalProtein": 0,
      "totalCarbs": 0,
      "totalFat": 0,
      "coachOpinion": "1-sentence expert nutritional advice for this specific day in Traditional Chinese"
    }
  ],
  "shoppingList": [
    { "name": "", "amount": "", "category": "protein" }
  ]
}`

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional sports nutritionist AI. Generate precise, realistic meal plans based on body composition data. Respond with valid JSON only. No markdown, no explanation, no code blocks.',
        },
        { role: 'user', content: userPrompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as { days: WeeklyPlan['days']; shoppingList: WeeklyPlan['shoppingList'] }

    // Server-side macro correction for every meal in every day
    const correctedDays = parsed.days.map((day) => {
      const meals = (['breakfast', 'lunch', 'dinner', 'snack'] as const).reduce((acc, type) => {
        if (day[type]) acc[type] = fixMacros(day[type] as Meal)
        return acc
      }, {} as Record<string, Meal>)
      const b = meals.breakfast, l = meals.lunch, d = meals.dinner, s = meals.snack
      const totalCalories = (b?.calories ?? 0) + (l?.calories ?? 0) + (d?.calories ?? 0) + (s?.calories ?? 0)
      const totalProtein  = (b?.protein  ?? 0) + (l?.protein  ?? 0) + (d?.protein  ?? 0) + (s?.protein  ?? 0)
      const totalCarbs    = (b?.carbs    ?? 0) + (l?.carbs    ?? 0) + (d?.carbs    ?? 0) + (s?.carbs    ?? 0)
      const totalFat      = (b?.fat      ?? 0) + (l?.fat      ?? 0) + (d?.fat      ?? 0) + (s?.fat      ?? 0)
      return { ...day, ...meals, totalCalories, totalProtein, totalCarbs, totalFat }
    })

    const weeklyPlan: WeeklyPlan = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      days: correctedDays,
      shoppingList: parsed.shoppingList,
      targetCalories,
      targetProtein,
      promptVersion: getPromptVersion(),
    }

    if (isAuthed) {
      await saveGeneratedWeeklyPlan(session!.user!.id, weeklyPlan, profileWithDefaults, getPromptVersion())
    }

    return NextResponse.json(weeklyPlan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
