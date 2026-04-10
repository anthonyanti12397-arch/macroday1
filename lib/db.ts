/**
 * Prisma client singleton — Phase 1 stub.
 *
 * Phase 1 (now): DATABASE_URL not set → all calls are no-ops.
 * Phase 2 (Vercel Postgres ready):
 *   1. npm install prisma @prisma/client
 *   2. Set DATABASE_URL in .env.local + Vercel env vars
 *   3. Uncomment the PrismaClient import below
 *   4. Run: npx prisma generate && npx prisma db push
 */

// ── Uncomment when ready for Phase 2 ────────────────────────────────────────
// import { PrismaClient } from '@prisma/client'
// const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
// export const prisma = globalForPrisma.prisma ?? (
//   process.env.DATABASE_URL ? new PrismaClient({ log: ['error'] }) : null
// )
// if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma
// ─────────────────────────────────────────────────────────────────────────────

export interface UpsertUserInput {
  email: string
  name?: string | null
  image?: string | null
  provider: string
}

/**
 * Phase 1: no-op. Phase 2: upsert user to Vercel Postgres.
 * Returns null until DATABASE_URL is configured.
 */
export async function upsertUser(input: UpsertUserInput): Promise<null> {
  // Phase 2 implementation (uncomment after Prisma setup):
  // if (!prisma) return null
  // return prisma.user.upsert({
  //   where:  { email: input.email },
  //   update: { name: input.name, image: input.image, lastLogin: new Date() },
  //   create: { email: input.email, name: input.name, image: input.image, provider: input.provider },
  // })
  void input  // suppress lint warning in Phase 1
  return null
}
