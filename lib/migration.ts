import type { MigrationPayload } from '@/lib/types'
import {
  getComplianceHistory,
  getInBodyHistory,
  getLatestWeeklyPlan,
  getTodayDailyMeals,
  getUserProfile,
  hasCompletedMigration,
  markMigrationComplete,
} from '@/lib/storage'
import { getStreakData } from '@/lib/streak'
import { PROMPT_VERSION } from '@/lib/constants'

export function buildMigrationPayload(): MigrationPayload {
  return {
    inbodyHistory: getInBodyHistory(),
    profile: getUserProfile(),
    dailyMeals: getTodayDailyMeals(),
    weeklyPlan: getLatestWeeklyPlan(),
    currentStreak: getStreakData().current,
    promptVersion: PROMPT_VERSION,
  }
}

export async function syncLocalDataToCloud(): Promise<boolean> {
  if (hasCompletedMigration()) return false

  const payload = buildMigrationPayload()
  const hasAnything =
    payload.inbodyHistory.length > 0 || !!payload.profile || !!payload.dailyMeals || !!payload.weeklyPlan

  if (!hasAnything) {
    markMigrationComplete()
    return false
  }

  const res = await fetch('/api/user/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error('Cloud sync failed')
  }

  markMigrationComplete()
  return true
}
