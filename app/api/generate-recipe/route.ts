import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { Meal, UserProfile } from '@/lib/types'
import { GROK_MODEL } from '@/lib/constants'

function getClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      ingredients: string[]
      profile: UserProfile
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    }

    const { ingredients, profile, mealType } = body

    const restrictions = profile.dietaryRestrictions.length > 0
      ? profile.dietaryRestrictions.join(', ')
      : 'None'
    const ingredientList = ingredients.length > 0
      ? ingredients.join(', ')
      : 'whatever fits the goal'

    const userPrompt = `Create a single ${mealType} recipe for a gym user.
Goal: ${profile.goal}
Dietary restrictions: ${restrictions}
Available ingredients (suggestions): ${ingredientList}

Return ONLY a JSON object with this exact structure:
{
  "name": "",
  "cookingTime": 0,
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "ingredients": [],
  "steps": []
}`

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional sports nutritionist AI. Generate precise, realistic meal recipes based on body composition data. Respond with valid JSON only. No markdown, no explanation, no code blocks.',
        },
        { role: 'user', content: userPrompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const meal = JSON.parse(cleaned) as Meal

    return NextResponse.json(meal)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
