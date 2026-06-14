import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { INBODY_OCR_PROMPT } from '@/lib/inbody-ocr'

// Vision OCR takes ~8-10s; give it headroom. On Hobby this is honoured when
// Fluid Compute is enabled (up to 60s), otherwise capped — the client now
// surfaces a clear timeout message and offers manual entry as a fallback.
export const maxDuration = 60

// OCR an InBody printout photo → structured fields for the coach-confirmation
// screen. Uses Grok vision (same path as /api/food/identify) so it shares the
// XAI_API_KEY the rest of the app already runs on. The coach reviews/corrects
// every value before it is saved, so moderate OCR error is acceptable.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = (await req.json()) as {
      imageBase64: string
      mimeType?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

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
        model: 'grok-4.3',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
              },
              { type: 'text', text: INBODY_OCR_PROMPT },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 700,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[InBody OCR] Vision API error:', err)
      return NextResponse.json({ error: 'Vision API failed' }, { status: 502 })
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''

    let result: Record<string, unknown>
    try {
      const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      console.error('[InBody OCR] Failed to parse response:', content)
      return NextResponse.json({ error: 'Could not parse InBody data' }, { status: 422 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[InBody OCR] Error:', error)
    return NextResponse.json({ error: 'Failed to read InBody sheet' }, { status: 500 })
  }
}
