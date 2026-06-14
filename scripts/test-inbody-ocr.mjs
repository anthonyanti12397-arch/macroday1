// Offline InBody OCR accuracy harness.
// Usage: node scripts/test-inbody-ocr.mjs
// Put sample photos in tmp/inbody-samples/ named with the model in the filename
// (e.g. 270.jpg, 370.jpg, 770.jpg). Ground truth below was read by hand from the
// three sample sheets the founder provided.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// --- load XAI_API_KEY from .env.local ---
function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return {}
  const out = {}
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

// --- the shared prompt (kept in sync with lib/inbody-ocr.ts) ---
function loadPrompt() {
  const src = readFileSync(join(ROOT, 'lib', 'inbody-ocr.ts'), 'utf8')
  const m = src.match(/INBODY_OCR_PROMPT = `([\s\S]*?)`/)
  if (!m) throw new Error('Could not extract INBODY_OCR_PROMPT from lib/inbody-ocr.ts')
  return m[1]
}

// --- ground truth, hand-read from the sample sheets ---
const GROUND_TRUTH = {
  270: {
    date: '2024-05-02', weight: 78.9, skeletalMuscleMass: 37.5, bodyFat: 16.7, bmr: 1789,
    visceralFatLevel: 6, visceralFatArea: null, height: 178, age: 30, gender: 'male',
    inbodyScore: 85, bmi: 24.9,
  },
  370: {
    date: '2023-04-13', weight: 56.9, skeletalMuscleMass: 28.4, bodyFat: 10.3, bmr: 1472,
    visceralFatLevel: 2, visceralFatArea: null, height: 169, age: 37, gender: 'male',
    inbodyScore: 74, bmi: 19.9,
  },
  770: {
    date: '2017-03-08', weight: 66.4, skeletalMuscleMass: 26.7, bodyFat: 27.2, bmr: 1413,
    visceralFatLevel: null, visceralFatArea: 71.2, height: 163, age: 41, gender: 'female',
    inbodyScore: 81, bmi: 25.0,
  },
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

async function ocr(key, prompt, b64, mime) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OCR_MODEL || 'grok-4.3',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}`, detail: 'high' } },
        { type: 'text', text: prompt },
      ] }],
      temperature: 0,
      max_tokens: 700,
    }),
  })
  if (!res.ok) throw new Error(`xAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content = (data.choices?.[0]?.message?.content ?? '').trim()
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned)
}

function cmp(got, want) {
  if (want === null) return got === null || got === undefined
  if (typeof want === 'number') return typeof got === 'number' && Math.abs(got - want) < 0.05
  return String(got) === String(want)
}

async function main() {
  const env = loadEnv()
  const key = env.XAI_API_KEY || process.env.XAI_API_KEY
  if (!key) { console.error('No XAI_API_KEY found in .env.local'); process.exit(1) }
  const prompt = loadPrompt()

  const dir = join(ROOT, 'tmp', 'inbody-samples')
  if (!existsSync(dir)) {
    console.error(`Put sample photos in ${dir} (name them e.g. 270.jpg, 370.jpg, 770.jpg)`); process.exit(1)
  }
  const files = readdirSync(dir).filter((f) => MIME[extname(f).toLowerCase()])
  if (!files.length) { console.error(`No images in ${dir}`); process.exit(1) }

  let totalFields = 0, totalHits = 0
  for (const f of files) {
    const model = (basename(f).match(/270|370|570|770/) || [])[0]
    const truth = GROUND_TRUTH[model]
    const b64 = readFileSync(join(dir, f)).toString('base64')
    process.stdout.write(`\n=== ${f} (model ${model ?? '?'}) ===\n`)
    let result
    try { result = await ocr(key, prompt, b64, MIME[extname(f).toLowerCase()]) }
    catch (e) { console.error('  OCR FAILED:', e.message); continue }

    console.log('  machineModel:', result.machineModel, '| confidence:', result.confidence)
    if (result.warnings?.length) console.log('  warnings:', result.warnings.join(', '))
    if (!truth) { console.log('  (no ground truth — raw output)\n', JSON.stringify(result, null, 2)); continue }

    const fields = Object.keys(truth)
    let hits = 0
    for (const k of fields) {
      const ok = cmp(result[k], truth[k])
      if (ok) hits++
      console.log(`  ${ok ? '✅' : '❌'} ${k.padEnd(20)} got=${JSON.stringify(result[k])}  want=${JSON.stringify(truth[k])}`)
    }
    totalFields += fields.length; totalHits += hits
    console.log(`  → ${hits}/${fields.length} fields correct (${Math.round((hits / fields.length) * 100)}%)`)
  }
  if (totalFields) console.log(`\n=== OVERALL: ${totalHits}/${totalFields} = ${Math.round((totalHits / totalFields) * 100)}% ===`)
}

main()
