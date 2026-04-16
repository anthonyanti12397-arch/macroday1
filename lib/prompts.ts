import { PROMPT_VERSION } from '@/lib/constants'
import type { InBodyRecord, PreferredCuisine, UserProfile } from '@/lib/types'
import { formatArrayAsString } from '@/lib/objectBuilders'

const CUISINE_PROMPTS: Record<PreferredCuisine, string> = {
  Argentine:
    'Prioritize Argentina-friendly ingredients and dishes such as lean beef, provoleta-style cheese swaps, chimichurri, milanesa-inspired plates, empanada wrappers, mate-friendly breakfasts, and affordable supermarket ingredients.',
  'Latin American':
    'Favor Latin American flavors and pantry logic: beans, corn, beef, chicken, rice, avocado, salsa fresca, tortillas, arepas, plantain, and grilled proteins.',
  Mediterranean:
    'Use Mediterranean ingredients such as olive oil, yogurt, chickpeas, seafood, herbs, tomatoes, cucumbers, and simple high-protein bowls.',
  Asian:
    'Favor Asian-friendly dishes with rice, noodles, tofu, stir-fries, soups, steamed proteins, and balanced sauces.',
  'High Protein Classics':
    'Keep meals practical and gym-friendly with simple proteins, oats, eggs, rice, potatoes, wraps, and straightforward prep.',
}

function estimateBMR(r: InBodyRecord): number {
  if (r.bmr) return r.bmr
  const base = 10 * r.weight + 6.25 * r.height - 5 * r.age
  return Math.round(r.gender === 'male' ? base + 5 : base - 161)
}

function calcTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = estimateBMR(inbody)
  const muscle = inbody.skeletalMuscleMass
  switch (goal) {
    case 'fat_loss':
      return {
        targetCalories: Math.round(bmr * 0.85),
        targetProtein: muscle ? Math.round(muscle * 2.2) : Math.round(inbody.weight * 1.8),
      }
    case 'muscle_gain':
      return {
        targetCalories: Math.round(bmr * 1.15),
        targetProtein: muscle ? Math.round(muscle * 2.5) : Math.round(inbody.weight * 2),
      }
    default:
      return {
        targetCalories: Math.round(bmr),
        targetProtein: muscle ? Math.round(muscle * 2) : Math.round(inbody.weight * 1.6),
      }
  }
}

export function getPromptVersion(): string {
  return PROMPT_VERSION
}

export function buildDailyPrompt(input: {
  inbody: InBodyRecord
  profile: UserProfile
  lang: 'zh' | 'en'
  dislikedIngredients?: string[]
  bonusCalories?: number
  isTakeoutMode?: boolean
  locationContext?: string
}) {
  const { inbody, profile, lang, dislikedIngredients = [], bonusCalories = 0, isTakeoutMode = false, locationContext = '' } = input
  const targets = calcTargets(inbody, profile.goal)
  const targetCalories = targets.targetCalories + bonusCalories
  const targetProtein = targets.targetProtein // Keep protein same, mostly want carbs/fat for bonus calories
  const restrictions = formatArrayAsString(profile.dietaryRestrictions, undefined, 'None')
  const proteins = formatArrayAsString(profile.proteinPreferences)
  const carbs = formatArrayAsString(profile.carbPreferences)
  const preferredCuisine = profile.preferredCuisine ?? 'High Protein Classics'
  const cuisineNote = CUISINE_PROMPTS[preferredCuisine]
  const disliked = [...(profile.dislikedIngredients ?? []), ...dislikedIngredients]
  const uniqueDisliked = Array.from(new Set(disliked.filter(Boolean)))

  const localeInstruction = 'All user-facing fields must be written in Traditional Chinese. Keep imagePrompt in English only. 所有餐點名稱、食材名稱、烹飪步驟必須使用繁體中文，不可出現英文食材名。'

  const cookingInstruction = {
    home: 'Meals should include full home-cooking ingredients and steps.',
    takeout: 'Meals should be realistic takeout or ready-to-buy options with whereToGet filled in.',
    both: 'Mix home-cooked and takeout realistically across the day.',
  }[profile.cookingStyle]

  const takeoutPrompt = isTakeoutMode ? `
TAKEOUT MODE ACTIVE (CRITICAL):
- The user is currently at or near: ${locationContext || 'Unknown Location'}.
- You MUST use your search capabilities to find REAL restaurants nearby that are available on Foodpanda or UberEats.
- For EACH meal, set "isTakeout": true.
- Identify a REAL dish name from a REAL restaurant that matches the nutrition targets.
- Set "whereToGet" to strictly: "[Restaurant Name] - [Dish Name]". This will be used for delivery app searching.
- Set "cookingTime": 0 and "steps": ["Order via Foodpanda or UberEats"].
` : ''

  const dislikeInstruction =
    uniqueDisliked.length > 0
      ? `Avoid these disliked ingredients entirely: ${uniqueDisliked.join(', ')}. Offer culturally close substitutions instead.`
      : 'No disliked ingredients recorded yet.'

  const replacementHint =
    preferredCuisine === 'Argentine' || preferredCuisine === 'Latin American'
      ? 'When helpful, use local substitutions such as beef cuts, empanada dough, chimichurri, tortillas, beans, or supermarket staples common in Argentina/Latin America.'
      : 'Use local supermarket-friendly substitutions when ingredients are uncommon.'

  return {
    targetCalories,
    targetProtein,
    promptVersion: PROMPT_VERSION,
    systemPrompt:
      'You are MacroDay, an expert sports nutrition coach. Return only valid JSON with no markdown, keep macros realistic, and ensure meals feel local and practical.',
    userPrompt: `Create today's breakfast, lunch, and dinner for a gym user.

Goal: ${profile.goal}
Targets: ${targetCalories} kcal and ${targetProtein}g protein
Preferred cuisine: ${preferredCuisine}
Cuisine strategy: ${cuisineNote}
Dietary restrictions: ${restrictions}
Protein preferences: ${proteins}
Carb preferences: ${carbs}
Cooking style: ${profile.cookingStyle}. ${cookingInstruction}
${dislikeInstruction}
${replacementHint}
${takeoutPrompt}

COACH PERSONA (CRITICAL):
- Based on the user's InBody data (goal: ${profile.goal}, bmr: ${targets.targetCalories}), provide a "coachOpinion".
- This is a 1-sentence supportive, expert insight in Traditional Chinese.
- Explain WHY these meals were selected for today's physical state.
- Keep it at the end of the JSON.

Requirements:
- The SUM of calories from breakfast, lunch, and dinner MUST equal exactly ${targetCalories} kcal.
- Each meal must have a different main protein or flavor profile.
- Match local availability and affordability.
- imagePrompt must always be in English.
- Include realistic ingredients, short steps, and useful whereToGet for takeout meals.
- Prioritize cultural fit over generic bodybuilding meals.
- If a requested ingredient is unavailable locally, substitute it with something locally common.
- Return this exact shape:
{
  "breakfast": { "name": "", "imagePrompt": "", "cookingTime": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
  "lunch": { "name": "", "imagePrompt": "", "cookingTime": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
  "dinner": { "name": "", "imagePrompt": "", "cookingTime": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": [], "steps": [], "isTakeout": false, "whereToGet": "" },
  "coachOpinion": "1-sentence expert nutritional advice in Traditional Chinese"
}

${localeInstruction}`,
  }
}

export function buildSwapPrompt(input: {
  inbody: InBodyRecord
  profile: UserProfile
  mealType: 'breakfast' | 'lunch' | 'dinner'
  currentMealName: string
  lang: 'zh' | 'en'
  isTakeoutMode?: boolean
  locationContext?: string
}) {
  const { isTakeoutMode = false, locationContext = '' } = input
  const { targetCalories, targetProtein } = calcTargets(input.inbody, input.profile.goal)
  const ratios = {
    breakfast: { calories: 0.25, protein: 0.25 },
    lunch: { calories: 0.4, protein: 0.4 },
    dinner: { calories: 0.35, protein: 0.35 },
  }
  const preferredCuisine = input.profile.preferredCuisine ?? 'High Protein Classics'
  const disliked = input.profile.dislikedIngredients?.join(', ') || 'none'
  const mealTargetCalories = Math.round(targetCalories * ratios[input.mealType].calories)
  const mealTargetProtein = Math.round(targetProtein * ratios[input.mealType].protein)

  return {
    promptVersion: PROMPT_VERSION,
    systemPrompt:
      'You are MacroDay, an expert sports nutrition coach. Return only valid JSON and make the meal feel locally appropriate.',
    userPrompt: `Generate a replacement ${input.mealType} that is clearly different from "${input.currentMealName}".
Targets: ${mealTargetCalories} kcal and ${mealTargetProtein}g protein.
Preferred cuisine: ${preferredCuisine}
Avoid disliked ingredients: ${disliked}
Cooking style: ${input.profile.cookingStyle}
Language: 所有餐點名稱、食材名稱、烹飪步驟必須使用繁體中文，不可出現英文食材名。imagePrompt 保持英文。

${isTakeoutMode ? `TAKEOUT MODE ACTIVE: Location ${locationContext}. Find a REAL restaurant dish nearby.` : ''}

Return exactly:
{"name":"","imagePrompt":"","cookingTime":0,"protein":0,"carbs":0,"fat":0,"ingredients":[],"steps":[],"isTakeout":false,"whereToGet":""}`,
  }
}

export function buildTrainingPrompt(input: {
  weight: number
  height: number
  age: number
  gender: 'male' | 'female'
  goal: 'fat_loss' | 'muscle_gain' | 'maintain'
  muscleKg?: number
  fatPercent?: number
  date: string
  focus?: 'upper' | 'lower' | 'full' | 'cardio' | string
  fitnessLevel?: 'beginner' | 'active' | 'advanced'
  diversity?: number
  excludeExercises?: string[]
  seed?: string
}) {
  const { diversity = 0.5, excludeExercises = [], seed = '' } = input

  const excludeInstruction = excludeExercises.length > 0
    ? `\nIMPORTANT: Avoid these exercises entirely (used in last 3 days): ${excludeExercises.join(', ')}. Use completely different exercises instead.`
    : ''

  const diversityInstruction = diversity > 0.7
    ? '\nEmphasis on VARIETY: Create unconventional exercises and creative exercise combinations. Avoid common gym exercise names—be creative and suggest lesser-known but effective movements.'
    : ''

  return {
    promptVersion: PROMPT_VERSION,
    systemPrompt: 'You are MacroDay, an expert fitness and strength coach. Return only valid JSON with no markdown.',
    userPrompt: `Design a personalized workout based on user biometrics.
Body: ${input.gender}, ${input.age} yrs, ${input.weight} kg, ${input.height} cm
Composition: ${input.fatPercent ? input.fatPercent + '% fat' : 'unknown fat'}, ${input.muscleKg ? input.muscleKg + 'kg muscle' : 'unknown muscle'}
Goal: ${input.goal}
Focus Area: ${input.focus || 'full'}
Fitness Level: ${input.fitnessLevel || 'beginner'}
${seed ? `Seed: ${seed}` : ''}

Strategy based on Goal:
- fat_loss: High reps (15-20), supersets, include cardio, 30-45s rest
- muscle_gain: Low reps (6-10), compound movements (squats/bench/deadlift/rows), 90-120s rest
- maintain: Moderate (10-15 reps), balanced full body, 60s rest

Strategy based on Fitness Level:
- beginner: Machine based, simple bodyweight, avoid complex free weights
- active: Mix of machines and free weights
- advanced: Free weights, barbell lifts, drop-sets, advanced techniques

Target Area: Ensure the exercises strongly correlate with the requested Focus Area (${input.focus || 'full'}).${excludeInstruction}${diversityInstruction}

Requirements:
- 1 Warmup exercise
- 4 to 6 Main exercises
- 1 Cooldown
- All text MUST be written in Traditional Chinese (繁體中文).
- Return this exact JSON object shape:
{
  "name": "string",
  "duration": 0,
  "warmup": "string",
  "exercises": [
    { "name": "string", "sets": 0, "reps": "string", "rest": "string", "tips": "string" }
  ],
  "cooldown": "string",
  "estimatedCalories": 0,
  "notes": "string"
}`
  }
}
