import { readFileSync } from 'node:fs'
// load DATABASE_URL from .env.local
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { PrismaClient } = await import('@prisma/client')
const p = new PrismaClient()
try {
  const tables = await p.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )
  console.log('TABLES:', tables.map((t) => t.table_name).join(', '))
  const cols = await p.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name='InBodyEntry' ORDER BY column_name"
  )
  console.log('InBodyEntry COLS:', cols.map((c) => c.column_name).join(', '))
  let mig
  try {
    mig = await p.$queryRawUnsafe('SELECT migration_name FROM _prisma_migrations ORDER BY started_at')
    console.log('MIGRATIONS RECORDED:', mig.map((m) => m.migration_name).join(', ') || '(none)')
  } catch {
    console.log('MIGRATIONS RECORDED: NO _prisma_migrations table (db push was used)')
  }
} finally {
  await p.$disconnect()
}
