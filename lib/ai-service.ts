import OpenAI from 'openai'
import type { DailyMeals, InBodyRecord, Meal, UserProfile } from '@/lib/types'
import { GROK_MODEL } from '@/lib/constants'
import { buildDailyPrompt } from '@/lib/prompts'
import { findPoolMatch } from '@/lib/recipe-pool'

export function getAIClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

export function ensureImagePrompt(meal: Meal, preferredCuisine?: string): Meal {
  if (meal.imagePrompt?.trim()) return meal
  const ingEn = meal.ingredients
    .slice(0, 3)
    .map((i) => i.replace(/[^\w\s(),]/g, ' ').trim())
    .filter(Boolean)
    .join(', ')
  meal.imagePrompt = `${meal.name}${ingEn ? ` made with ${ingEn}` : ''}, ${preferredCuisine ?? 'regional'} food photography`
  return meal
}

export function validateAndFixMacros(meal: Meal): Meal {
  const calculated = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
  const reported = meal.calories || 0
  
  const diffPercent = reported > 0 ? Math.abs(reported - calculated) / reported : 1
  
  if (diffPercent > 0.25 && reported > 0) {
    console.warn(`[AI Validation] Large calorie discrepancy in ${meal.name}: Reported ${reported}, Calculated ${calculated}. Fixing...`)
  }

  if (calculated === 0 && reported > 100) {
    console.error(`[AI Validation] Meal ${meal.name} has calories but 0 macros. AI Hallucination detected.`)
  }

  return { ...meal, calories: calculated }
}

export async function generateDailyMealsInner(args: {
  inbody: InBodyRecord
  profile: UserProfile
  lang?: 'zh' | 'en'
  hasTraining?: boolean
  estimatedCaloriesBurned?: number
  isTakeoutMode?: boolean
  locationContext?: string
}): Promise<DailyMeals> {
  const { inbody, profile, lang = 'zh', hasTraining, estimatedCaloriesBurned, isTakeoutMode = false, locationContext = '' } = args
  
  const prompt = buildDailyPrompt({
    inbody,
    profile,
    lang,
    dislikedIngredients: profile.dislikedIngredients,
    bonusCalories: hasTraining ? (estimatedCaloriesBurned || 300) : 0,
    isTakeoutMode,
    locationContext
  })

  // 1. Try pool match first
  const poolMatch = findPoolMatch(prompt.targetCalories, prompt.targetProtein)
  if (poolMatch) {
    return {
      ...poolMatch,
      date: localDate(),
      promptVersion: prompt.promptVersion,
    }
  }

  // 2. Call AI
  const client = getAIClient()
  const completion = await client.chat.completions.create({
    model: GROK_MODEL,
    max_tokens: 1800,
    temperature: 0.7,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userPrompt },
    ],
  })

  const rawText = completion.choices[0]?.message?.content ?? ''
  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse JSON from AI response')
  
  const parsed = JSON.parse(match[0]) as {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    coachOpinion?: string
  }

  return {
    date: localDate(),
    breakfast: validateAndFixMacros(ensureImagePrompt(parsed.breakfast, profile.preferredCuisine)),
    lunch: validateAndFixMacros(ensureImagePrompt(parsed.lunch, profile.preferredCuisine)),
    dinner: validateAndFixMacros(ensureImagePrompt(parsed.dinner, profile.preferredCuisine)),
    targetCalories: prompt.targetCalories,
    targetProtein: prompt.targetProtein,
    promptVersion: prompt.promptVersion,
    coachOpinion: parsed.coachOpinion,
  }
}

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
