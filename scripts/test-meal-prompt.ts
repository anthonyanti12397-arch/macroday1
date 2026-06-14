/** Verify the v3 body-aware prompt + new model produce body-tailored meals. */
import { readFileSync } from 'node:fs'
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

;(async () => {
  const { buildDailyPrompt } = await import('../lib/prompts')
  const { GROK_MODEL } = await import('../lib/constants')

  // A high-body-fat fat-loss user — the prompt should steer toward satiety/fibre.
  const built = buildDailyPrompt({
    inbody: { id: 'x', date: '2026-06-14', weight: 92, height: 175, gender: 'male', age: 34, bodyFat: 28, skeletalMuscleMass: 33, bmr: 1850, visceralFatLevel: 12 },
    profile: {
      goal: 'fat_loss', activityLevel: 'moderate', dietaryRestrictions: [], cookingStyle: 'both',
      preferredCuisine: 'Asian', isPro: true, isAdFree: false,
    } as any,
    lang: 'zh',
  })

  console.log('MODEL:', GROK_MODEL, '| version:', built.promptVersion)
  console.log('--- BODY COMPOSITION block in prompt ---')
  console.log(built.userPrompt.split('Preferred cuisine')[0].split('BODY COMPOSITION')[1]?.trim().slice(0, 400))

  const t0 = Date.now()
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    body: JSON.stringify({
      model: GROK_MODEL, max_tokens: 1800, temperature: 0.7,
      messages: [
        { role: 'system', content: built.systemPrompt },
        { role: 'user', content: built.userPrompt },
      ],
    }),
  })
  const d = await res.json()
  const txt = d.choices?.[0]?.message?.content ?? ''
  const j = JSON.parse(txt.match(/\{[\s\S]*\}/)![0])
  console.log(`\n--- generated in ${((Date.now() - t0) / 1000).toFixed(1)}s ---`)
  for (const k of ['breakfast', 'lunch', 'dinner']) console.log(`  ${k}: ${j[k].name} (P${j[k].protein}/C${j[k].carbs}/F${j[k].fat})`)
  console.log(`  coachOpinion: ${j.coachOpinion}`)
})()
