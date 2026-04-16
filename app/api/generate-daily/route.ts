import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveGeneratedDailyPlan } from '@/lib/db'
import { generateDailyMealsInner } from '@/lib/ai-service'
import { GenerateDailySchema } from '@/lib/validations'
import { hydrateInBodyRecord, normalizeUserProfile } from '@/lib/objectBuilders'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()
    const validation = GenerateDailySchema.safeParse(rawBody)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { inbody, profile, lang = 'zh', hasTraining, estimatedCaloriesBurned, isTakeoutMode = false, locationContext = '' } = validation.data
    const session = await getServerSession(authOptions)
    const isAuthed = !!session?.user?.id

    const inbodyWithMeta = hydrateInBodyRecord(inbody)
    const profileWithDefaults = normalizeUserProfile(profile, { isTakeoutMode, isAuthed })

    const result = await generateDailyMealsInner({
      inbody: inbodyWithMeta,
      profile: profileWithDefaults,
      lang,
      hasTraining,
      estimatedCaloriesBurned,
      isTakeoutMode,
      locationContext
    })

    if (isAuthed) {
      await saveGeneratedDailyPlan(session!.user!.id, result, profileWithDefaults, result.promptVersion ?? 'v2-regional')
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[API/Generate-Daily] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
