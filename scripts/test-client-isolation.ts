/**
 * Integration test against the REAL Neon DB, exercising the actual lib/db
 * functions (not a reimplementation). Proves the coach/personal data isolation:
 * a coach's personal localStorage sync must NEVER delete their students' InBody
 * records, even though those records share the coach's userId.
 *
 * Run: npx tsx scripts/test-client-isolation.ts   (loads .env.local first)
 */
import { readFileSync } from 'node:fs'
import type { MigrationPayload } from '../lib/types'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

let pass = 0, fail = 0
function check(label: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✅ ${label}`) }
  else { fail++; console.log(`  ❌ ${label}`) }
}

function selfPayload(date: string, weight: number): MigrationPayload {
  return {
    inbodyHistory: [{ id: `self-${date}`, date, weight, height: 178, gender: 'male', age: 30 }],
    profile: null, dailyMeals: null, weeklyPlan: null, currentStreak: 0,
  }
}

;(async () => {
  const {
    prisma, syncUserLocalData, createClient, addClientInBodyEntry,
    getClientInBody, getLatestInBodyRecord, getUserCloudSnapshot,
  } = await import('../lib/db')

  const coach = await prisma.user.create({ data: { provider: 'test', name: 'TEST_COACH_ISO' } })
  const coach2 = await prisma.user.create({ data: { provider: 'test', name: 'TEST_COACH_2' } })

  try {
    console.log('1. Coach syncs their own InBody (personal mode, clientId=null)')
    await syncUserLocalData(coach.id, selfPayload('2026-05-01', 80))

    console.log('2. Coach adds a student + a student measurement')
    const client = await createClient(coach.id, { name: 'TEST_STUDENT' })
    await addClientInBodyEntry(coach.id, client.id, {
      entryDate: '2026-05-10', weight: 60, height: 165, gender: 'female', age: 25, bodyFat: 22,
    })
    const before = await getClientInBody(coach.id, client.id)
    check('student has 1 measurement after add', before?.entries.length === 1)

    console.log('3. Coach re-syncs personal data (THE bug trigger — old code wiped students here)')
    await syncUserLocalData(coach.id, selfPayload('2026-06-01', 78))

    console.log('4. Verify isolation')
    const after = await getClientInBody(coach.id, client.id)
    check('student measurement SURVIVED the coach self-sync', after?.entries.length === 1)

    const latest = await getLatestInBodyRecord(coach.id)
    check('coach getLatest returns own entry (78), not student (60)', latest?.weight === 78 && latest?.clientId === null)

    const snap = await getUserCloudSnapshot(coach.id)
    const snapWeights = (snap?.inbodyHistory ?? []).map((r) => r.weight)
    check('coach cloud snapshot excludes student entries', !snapWeights.includes(60) && snapWeights.includes(78))

    console.log('5. IDOR: a different coach cannot read this student')
    const stolen = await getClientInBody(coach2.id, client.id)
    check('foreign coach gets null for another coach’s client', stolen === null)
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [coach.id, coach2.id] } } })
    await prisma.$disconnect()
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===`)
  process.exit(fail ? 1 : 0)
})()
