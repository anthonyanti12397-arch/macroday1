import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this food image and provide ONLY a JSON response with this exact structure (no markdown, no explanation):
{
  "foodName": "name in Traditional Chinese (繁體中文)",
  "englishName": "English name",
  "servingSize": "typical serving size (e.g. 100g, 1 plate, 1 bowl)",
  "estimatedCalories": 0,
  "estimatedProtein": 0,
  "estimatedCarbs": 0,
  "estimatedFat": 0,
  "ingredients": ["main ingredients"],
  "confidence": 0.0
}

Rules:
- All nutrition estimates should be for the serving size shown
- Confidence: 1.0 = very confident, 0.5 = moderate, 0.0 = cannot identify
- If confidence < 0.5, set all nutrition values to 0
- Food name MUST be in Traditional Chinese (繁體中文)
- Be conservative with calorie estimates`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const cleaned = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('identify-food error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
