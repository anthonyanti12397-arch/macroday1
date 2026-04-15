import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { base64Image, checkInType, mealName } = await req.json() as {
      base64Image: string
      checkInType: 'meal' | 'training'
      mealName?: string
    }

    if (!base64Image || !checkInType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 30% random verification check (cost saving)
    if (Math.random() > 0.3) {
      return NextResponse.json({ verified: true, reason: 'Spot check skipped', confidence: 'low' })
    }

    const prompt = checkInType === 'meal'
      ? `User claims they ate "${mealName || 'a meal'}". Does this image show a real prepared meal with actual food? Is this a genuine photo (not a screenshot, cartoon, or stock photo)? Reply with JSON only, no markdown: { "verified": boolean, "reason": "short explanation" }`
      : `Does this image show someone exercising, gym equipment, workout activity, or a post-workout state (e.g. sweaty, gym selfie)? Reply with JSON only, no markdown: { "verified": boolean, "reason": "short explanation" }`

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: base64Image } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errRes = await response.text()
      console.error('Vision API responded with error', response.status, errRes)
      throw new Error('Vision API failed')
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    
    if (!match) throw new Error('Failed to parse JSON')

    const result = JSON.parse(match[0]) as { verified: boolean; reason: string }
    return NextResponse.json({ ...result, confidence: 'high' })

  } catch (err) {
    console.error('verify-checkin error:', err)
    // Default pass when there are upstream errors so users aren't punished.
    return NextResponse.json({ verified: true, reason: 'Verification error, passed by default', confidence: 'low' })
  }
}
