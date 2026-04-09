'use client'

export interface StreakData {
  current: number   // consecutive days with ≥1 meal logged
  best: number      // longest ever streak
  todayDone: boolean
}

function dateStr(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().split('T')[0]
}

function getMealsEatenOnDate(ds: string): number {
  try {
    const raw = localStorage.getItem(`macroday_eaten_${ds}`)
    if (!raw) return 0
    const eaten = JSON.parse(raw) as string[]
    return eaten.length
  } catch {
    return 0
  }
}

export function getStreakData(lookback = 365): StreakData {
  const todayDs = dateStr(0)
  const todayMeals = getMealsEatenOnDate(todayDs)
  const todayDone = todayMeals > 0

  // Calculate current streak (going backwards from yesterday if today not done)
  let current = 0
  // Start from today — count today if it has meals
  let offset = 0
  while (offset < lookback) {
    const ds = dateStr(offset)
    const meals = getMealsEatenOnDate(ds)
    if (meals > 0) {
      current++
      offset++
    } else if (offset === 0) {
      // Today has no meals — start counting from yesterday
      offset = 1
      // Don't increment, just skip today
      continue
    } else {
      break
    }
  }

  // Calculate best streak
  const BEST_KEY = 'macroday_best_streak'
  let best = 0
  try {
    best = parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0
  } catch { /* ignore */ }

  if (current > best) {
    best = current
    try { localStorage.setItem(BEST_KEY, String(best)) } catch { /* ignore */ }
  }

  return { current, best, todayDone }
}
