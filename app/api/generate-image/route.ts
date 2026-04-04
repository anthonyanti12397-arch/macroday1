import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.TOGETHER_API_KEY ?? 'placeholder',
    baseURL: 'https://api.together.xyz/v1',
  })
}

export async function POST(req: NextRequest) {
  try {
    const { mealName, imagePrompt } = await req.json() as { mealName: string; imagePrompt?: string }

    // Prefer the AI-generated English imagePrompt; fall back to mealName
    const subject = imagePrompt?.trim() || mealName

    const prompt = `Professional food photography of ${subject}. Overhead shot on a clean white or light wooden surface, natural daylight, vibrant and appetising, restaurant quality plating, shallow depth of field, highly detailed.`

    const client = getClient()
    const response = await client.images.generate({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt,
      n: 1,
      // @ts-expect-error Together AI supports width/height
      width: 1024,
      height: 768,
    })

    const url = response.data?.[0]?.url ?? null
    if (!url) return NextResponse.json({ error: 'No image returned' }, { status: 500 })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
