import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json() as {
      imageBase64: string
      mimeType?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const prompt = `You are a nutrition expert. Analyze this food image and estimate the macronutrients.

Return ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "name": "Food name in English",
  "nameZh": "食物名稱（中文）",
  "calories": 450,
  "protein": 32,
  "carbs": 45,
  "fat": 12,
  "serving": "1 portion (~350g)",
  "confidence": "high",
  "ingredients": ["chicken breast", "rice", "vegetables"]
}

Rules:
- Estimate for the full portion visible in the image
- confidence: "high" if food is clearly identifiable, "medium" if uncertain, "low" if very unclear
- All numbers should be integers
- If you cannot identify food in the image, return: {"error": "No food detected"}`

    const xaiKey = process.env.XAI_API_KEY
    if (!xaiKey) {
      return NextResponse.json({ error: 'Vision API not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${xaiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Food Identify] Vision API error:', err)
      return NextResponse.json({ error: 'Vision API failed' }, { status: 502 })
    }

    const data = await response.json() as { choices: { message: { content: string } }[] }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''

    // Parse JSON from response
    let result: Record<string, unknown>
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      console.error('[Food Identify] Failed to parse response:', content)
      return NextResponse.json({ error: 'Could not parse food data' }, { status: 422 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Food Identify] Error:', error)
    return NextResponse.json({ error: 'Failed to identify food' }, { status: 500 })
  }
}
