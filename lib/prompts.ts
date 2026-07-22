import { PROMPT_VERSION } from '@/lib/constants'
import type { InBodyRecord, PreferredCuisine, UserProfile } from '@/lib/types'
import { formatArrayAsString } from '@/lib/objectBuilders'

/**
 * Neutralize free-text user input before it is interpolated into an LLM prompt.
 * Strips newlines (the main lever for "ignore previous instructions" injection),
 * collapses whitespace, removes control chars, and hard-caps length. Use this on
 * ANY field the user types that ends up in a system/user prompt.
 */
export function sanitizePromptInput(value: string | undefined | null, maxLen = 80): string {
  if (!value) return ""
  // Drop ALL control chars (incl. newlines) by code point — newlines are the
  // main lever for "ignore previous instructions" prompt injection.
  const stripped = Array.from(String(value))
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join("")
  return stripped.replace(/\s{2,}/g, " ").trim().slice(0, maxLen)
}

const CUISINE_PROMPTS: Record<PreferredCuisine, string> = {
  HongKong:
    '以香港飲食為主：茶餐廳與粵菜邏輯，常用食材如雞蛋、瘦豬肉、牛肉、雞胸、白飯、通粉、菜心/芥蘭、豆腐、蒸魚。手法以蒸、灼、炒、燉為主，少油炸。食材需在香港街市與超市容易買到。',
  Taiwanese:
    '以台式家常與小吃為主：常用雞胸、豬里肌、蛋、糙米/白飯、地瓜、豆干、青菜、滷味。口味清爽，手法以滷、蒸、煎、炒為主。食材需在台灣超市與傳統市場容易買到。',
  ChineseHome:
    '以中式家常菜為主：常見蛋白如雞、豬、牛、魚、豆腐、雞蛋，搭配白飯/糙米/麵與時令蔬菜。手法以炒、蒸、燉、涼拌為主，均衡少油。',
  JapaneseKorean:
    '以日式與韓式健康餐為主：常用鮭魚、雞胸、蛋、豆腐、納豆、味噌、泡菜、海帶、糙米/五穀飯。手法以烤、蒸、煮、涼拌為主，低油高蛋白。',
  HealthyLight:
    '清淡少油、減脂導向：高纖高飽足，優先瘦肉、白肉、魚、蛋白、豆腐、大量蔬菜與全穀，控制精緻碳水與添加糖，手法以蒸、灼、烤為主。',
  HighProtein:
    '西式高蛋白健身餐：簡單實用，常用雞胸、牛肉、蛋、燕麥、白飯、馬鈴薯、希臘優格、捲餅，備餐容易、蛋白質充足。',
}

function estimateBMR(r: InBodyRecord): number {
  if (r.bmr) return r.bmr
  const base = 10 * r.weight + 6.25 * r.height - 5 * r.age
  return Math.round(r.gender === 'male' ? base + 5 : base - 161)
}

/**
 * Turn the user's actual InBody numbers into a body-composition briefing the
 * model can act on — not just BMR. Gives the LLM the real stats plus a few
 * coach-style interpretation hints so meals are tailored to this body, not a
 * generic profile. All hints are framed as guidance, never medical claims.
 */
function describeBodyComposition(r: InBodyRecord, goal: UserProfile['goal']): string {
  const lines: string[] = []
  lines.push(`- Stats: ${r.gender}, ${r.age}y, ${r.weight}kg, ${r.height}cm.`)

  if (r.bodyFat != null) {
    const high = r.gender === 'male' ? r.bodyFat >= 22 : r.bodyFat >= 32
    const lean = r.gender === 'male' ? r.bodyFat <= 12 : r.bodyFat <= 20
    lines.push(
      `- Body fat: ${r.bodyFat}%` +
        (high ? ' (on the higher side — favour high-satiety, high-fibre, lower-glycaemic choices and keep added sugar/refined carbs modest).'
          : lean ? ' (already lean — protect muscle with ample protein and enough carbs around activity).'
            : ' (mid-range — keep a balanced plate).')
    )
  }
  if (r.skeletalMuscleMass != null) {
    lines.push(`- Skeletal muscle: ${r.skeletalMuscleMass}kg (drives the protein target — distribute protein across all 3 meals, ~${Math.round((r.skeletalMuscleMass * 2) / 3)}g+ each).`)
  }
  if (r.visceralFatLevel != null && r.visceralFatLevel >= 10) {
    lines.push(`- Visceral fat level ${r.visceralFatLevel} (elevated — lean toward whole foods, unsaturated fats, and fewer fried/processed items).`)
  }
  if (r.bmr) lines.push(`- BMR: ${r.bmr} kcal.`)

  const goalLine = {
    fat_loss: 'Goal fat-loss: keep a gentle deficit, prioritise protein + volume so meals stay filling.',
    muscle_gain: 'Goal muscle-gain: slight surplus, protein-forward, carbs around training.',
    maintain: 'Goal maintain: balanced macros, steady energy.',
  }[goal]
  lines.push(`- ${goalLine}`)
  return lines.join('\n')
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
  const { inbody, profile, lang, dislikedIngredients = [], bonusCalories = 0, isTakeoutMode = false } = input
  // Sanitize user free-text before it reaches the prompt (prompt-injection defense)
  const locationContext = sanitizePromptInput(input.locationContext, 120)
  const targets = calcTargets(inbody, profile.goal)
  const targetCalories = targets.targetCalories + bonusCalories
  const targetProtein = targets.targetProtein // Keep protein same, mostly want carbs/fat for bonus calories
  const restrictions = formatArrayAsString(profile.dietaryRestrictions, undefined, 'None')
  const proteins = formatArrayAsString(profile.proteinPreferences)
  const carbs = formatArrayAsString(profile.carbPreferences)
  const preferredCuisine = profile.preferredCuisine ?? 'ChineseHome'
  // Guard against legacy/unknown values stored before the cuisine set changed.
  const cuisineNote = CUISINE_PROMPTS[preferredCuisine] ?? CUISINE_PROMPTS.ChineseHome
  const disliked = [...(profile.dislikedIngredients ?? []), ...dislikedIngredients]
  const uniqueDisliked = Array.from(new Set(disliked.filter(Boolean).map((d) => sanitizePromptInput(d, 40)).filter(Boolean)))

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
    '若某食材在台灣/香港不常見或較貴，改用當地街市與超市容易買到的相近食材替代。'

  return {
    targetCalories,
    targetProtein,
    promptVersion: PROMPT_VERSION,
    systemPrompt:
      'You are MacroDay, an expert sports nutrition coach. Return only valid JSON with no markdown, keep macros realistic, and ensure meals feel local and practical.',
    userPrompt: `Create today's breakfast, lunch, and dinner for a gym user.

Goal: ${profile.goal}
Targets: ${targetCalories} kcal and ${targetProtein}g protein

BODY COMPOSITION (tailor today's meals to THIS body, not a generic profile):
${describeBodyComposition(inbody, profile.goal)}

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
- Provide a "coachOpinion": 1 sentence, Traditional Chinese, supportive + expert.
- Reference the user's ACTUAL body composition above (e.g. their body-fat % or muscle mass) and explain WHY today's meals fit their ${profile.goal} goal — not a generic platitude.
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
  const { isTakeoutMode = false } = input
  // Sanitize user free-text before it reaches the prompt (prompt-injection defense)
  const locationContext = sanitizePromptInput(input.locationContext, 120)
  const { targetCalories, targetProtein } = calcTargets(input.inbody, input.profile.goal)
  const ratios = {
    breakfast: { calories: 0.25, protein: 0.25 },
    lunch: { calories: 0.4, protein: 0.4 },
    dinner: { calories: 0.35, protein: 0.35 },
  }
  const preferredCuisine = input.profile.preferredCuisine ?? 'ChineseHome'
  const cuisineNote = CUISINE_PROMPTS[preferredCuisine] ?? CUISINE_PROMPTS.ChineseHome
  const disliked = (input.profile.dislikedIngredients ?? []).map((d) => sanitizePromptInput(d, 40)).filter(Boolean).join(', ') || 'none'
  const mealTargetCalories = Math.round(targetCalories * ratios[input.mealType].calories)
  const mealTargetProtein = Math.round(targetProtein * ratios[input.mealType].protein)

  return {
    promptVersion: PROMPT_VERSION,
    systemPrompt:
      'You are MacroDay, an expert sports nutrition coach. Return only valid JSON and make the meal feel locally appropriate.',
    userPrompt: `Generate a replacement ${input.mealType} that is clearly different from "${input.currentMealName}".
Targets: ${mealTargetCalories} kcal and ${mealTargetProtein}g protein.
Cuisine strategy: ${cuisineNote}
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
