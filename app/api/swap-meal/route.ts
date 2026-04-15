import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { InBodyRecord, Meal, UserProfile } from '@/lib/types'
import { GROK_MODEL } from '@/lib/constants'
import { buildSwapPrompt } from '@/lib/prompts'

function getClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

function fixMacros(meal: Meal): Meal {
  const calculated = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
  return { ...meal, calories: calculated }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      inbody: InBodyRecord
      profile: UserProfile
      mealType: 'breakfast' | 'lunch' | 'dinner'
      currentMealName: string
      lang?: 'zh' | 'en'
      isTakeoutMode?: boolean
      locationContext?: string
    }
    const { inbody, profile, mealType, currentMealName, lang = 'zh', isTakeoutMode = false, locationContext = '' } = body

    const prompt = buildSwapPrompt({
      inbody,
      profile,
      mealType,
      currentMealName,
      lang,
      isTakeoutMode,
      locationContext
    })

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 600,
      temperature: 0.9,
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Meal

    return NextResponse.json({ ...fixMacros(parsed), imagePrompt: parsed.imagePrompt ?? `${parsed.name}, food photography` })
  } catch (err) {
    console.error('swap-meal error:', err)
    return NextResponse.json({ error: 'Failed to swap meal' }, { status: 500 })
  }
}
