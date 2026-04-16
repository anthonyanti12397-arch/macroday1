import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GROK_MODEL } from '@/lib/constants'
import { buildTrainingPrompt } from '@/lib/prompts'
import type { TrainingPlan } from '@/lib/types'

function getClient() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY ?? 'placeholder',
    baseURL: 'https://api.x.ai/v1',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      weight, height, age, gender, goal,
      muscleKg, fatPercent, date, focus, fitnessLevel,
      diversity = 0.5, excludeExercises = [], seed = ''
    } = body

    if (!weight || !height || !age || !gender || !goal || !date) {
      return NextResponse.json({ error: 'Missing required training parameters' }, { status: 400 })
    }

    const prompt = buildTrainingPrompt({
      weight, height, age, gender, goal,
      muscleKg, fatPercent, date, focus, fitnessLevel,
      diversity, excludeExercises, seed
    })

    // Adjust temperature based on diversity: 0.5 → 0.7, 1.0 → 0.9
    const temperature = 0.7 + (diversity - 0.5) * 0.4

    const client = getClient()
    const completion = await client.chat.completions.create({
      model: GROK_MODEL,
      max_tokens: 1500,
      temperature,
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt },
      ],
    })

    const rawText = completion.choices[0]?.message?.content ?? ''
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse JSON from AI response')

    const parsed = JSON.parse(match[0]) as TrainingPlan

    // Include seed and diversity in response
    if (seed) parsed.seed = seed
    parsed.diversity = diversity

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('generate-training error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
