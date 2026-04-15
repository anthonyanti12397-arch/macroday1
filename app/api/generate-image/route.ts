import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

async function generateWithRetry(prompt: string, retries = 1) {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('SILICONFLOW_API_KEY is not set. Please add it to your environment variables.')
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch('https://api.siliconflow.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt,
          image_size: '512x512',
          num_inference_steps: 4
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || `API error: ${res.status}`)
      }

      const url = data.images?.[0]?.url || data.data?.[0]?.url
      if (url) return url
      
      throw new Error('No image URL in response')
    } catch (err) {
      console.warn(`SiliconFlow attempt ${i + 1} failed:`, err)
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { mealName, imagePrompt } = await req.json() as { mealName: string; imagePrompt?: string }
    const subject = imagePrompt?.trim() || mealName
    const prompt = `Food photo of ${subject}, overhead shot, white background, natural light, appetizing, restaurant quality`

    const url = await generateWithRetry(prompt)

    if (!url) return NextResponse.json({ error: 'No image returned' }, { status: 500 })

    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
