import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClientInBody, addClientInBodyEntry, type ClientInBodyInput } from '@/lib/db'

// GET /api/clients/[id]/inbody — the client's InBody history (oldest → newest)
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await getClientInBody(session.user.id, params.id)
    if (!result) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json(result)
  } catch (error) {
    console.error('get client inbody error', error)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// POST /api/clients/[id]/inbody — add a (coach-confirmed) measurement
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const b = (await req.json()) as Record<string, unknown>
    const weight = num(b.weight)
    const height = num(b.height)
    const age = num(b.age)
    const gender = b.gender === 'female' ? 'female' : 'male'
    if (weight === null || height === null || age === null) {
      return NextResponse.json({ error: 'Weight, height and age are required' }, { status: 400 })
    }
    const input: ClientInBodyInput = {
      entryDate: typeof b.entryDate === 'string' && b.entryDate ? b.entryDate : new Date().toISOString().slice(0, 10),
      weight,
      height,
      age,
      gender,
      bodyFat: num(b.bodyFat),
      skeletalMuscleMass: num(b.skeletalMuscleMass),
      bmr: num(b.bmr),
      visceralFatLevel: num(b.visceralFatLevel),
      visceralFatArea: num(b.visceralFatArea),
      bodyWater: num(b.bodyWater),
      inbodyScore: num(b.inbodyScore),
      bmi: num(b.bmi),
    }
    const entry = await addClientInBodyEntry(session.user.id, params.id, input)
    if (!entry) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ entry })
  } catch (error) {
    console.error('add client inbody error', error)
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 })
  }
}
