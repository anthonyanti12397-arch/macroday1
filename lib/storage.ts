'use client'

import type { InBodyRecord, UserProfile, WeeklyPlan, UsageRecord, DailyMeals, GuestSession } from './types'

const KEYS = {
  INBODY_HISTORY: 'fuelweek_inbody_history',
  USER_PROFILE: 'fuelweek_user_profile',
  WEEKLY_PLAN: 'fuelweek_weekly_plan',
  USAGE: 'fuelweek_usage',
  SHOPPING_CHECKED: 'fuelweek_shopping_checked',
  DAILY_MEALS: 'fuelweek_daily_meals',
  SESSION: 'macroday_session',
  LANG: 'macroday_lang',
} as const

// ── InBody ────────────────────────────────────────────────────────────────────

export function saveInBodyRecord(record: InBodyRecord): void {
  try {
    const history = getInBodyHistory()
    history.push(record)
    localStorage.setItem(KEYS.INBODY_HISTORY, JSON.stringify(history))
  } catch {
    // SSR or storage unavailable
  }
}

export function getInBodyHistory(): InBodyRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.INBODY_HISTORY)
    if (!raw) return []
    return JSON.parse(raw) as InBodyRecord[]
  } catch {
    return []
  }
}

export function getLatestInBody(): InBodyRecord | null {
  try {
    const history = getInBodyHistory()
    if (history.length === 0) return null
    return history[history.length - 1]
  } catch {
    return null
  }
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile))
  } catch {
    // SSR or storage unavailable
  }
}

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEYS.USER_PROFILE)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

// ── Weekly Plan ───────────────────────────────────────────────────────────────

export function saveWeeklyPlan(plan: WeeklyPlan): void {
  try {
    localStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan))
  } catch {
    // SSR or storage unavailable
  }
}

export function getLatestWeeklyPlan(): WeeklyPlan | null {
  try {
    const raw = localStorage.getItem(KEYS.WEEKLY_PLAN)
    if (!raw) return null
    return JSON.parse(raw) as WeeklyPlan
  } catch {
    return null
  }
}

// ── Usage ─────────────────────────────────────────────────────────────────────

export function getTodayUsage(): UsageRecord {
  try {
    resetUsageIfNewDay()
    const raw = localStorage.getItem(KEYS.USAGE)
    if (!raw) return { date: todayStr(), count: 0 }
    return JSON.parse(raw) as UsageRecord
  } catch {
    return { date: todayStr(), count: 0 }
  }
}

export function incrementUsage(): void {
  try {
    const usage = getTodayUsage()
    usage.count += 1
    localStorage.setItem(KEYS.USAGE, JSON.stringify(usage))
  } catch {
    // SSR or storage unavailable
  }
}

export function resetUsageIfNewDay(): void {
  try {
    const raw = localStorage.getItem(KEYS.USAGE)
    if (!raw) return
    const usage = JSON.parse(raw) as UsageRecord
    if (usage.date !== todayStr()) {
      localStorage.setItem(KEYS.USAGE, JSON.stringify({ date: todayStr(), count: 0 }))
    }
  } catch {
    // SSR or storage unavailable
  }
}

// ── Shopping Checked ──────────────────────────────────────────────────────────

export function saveShoppingChecked(checked: Record<string, boolean>): void {
  try {
    localStorage.setItem(KEYS.SHOPPING_CHECKED, JSON.stringify(checked))
  } catch {
    // SSR or storage unavailable
  }
}

export function getShoppingChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEYS.SHOPPING_CHECKED)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

// ── Daily Meals ───────────────────────────────────────────────────────────────
// Cached per-day so we don't re-generate on every visit

export function saveDailyMeals(meals: DailyMeals): void {
  try {
    localStorage.setItem(KEYS.DAILY_MEALS, JSON.stringify(meals))
  } catch {
    // SSR or storage unavailable
  }
}

export function getTodayDailyMeals(): DailyMeals | null {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_MEALS)
    if (!raw) return null
    const meals = JSON.parse(raw) as DailyMeals
    // Only return if it was generated today
    if (meals.date !== todayStr()) return null
    return meals
  } catch {
    return null
  }
}

export function updateMealImage(mealType: 'breakfast' | 'lunch' | 'dinner', imageUrl: string): void {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_MEALS)
    if (!raw) return
    const meals = JSON.parse(raw) as DailyMeals
    meals[mealType] = { ...meals[mealType], imageUrl }
    localStorage.setItem(KEYS.DAILY_MEALS, JSON.stringify(meals))
  } catch {
    // SSR or storage unavailable
  }
}

// ── Guest Session ─────────────────────────────────────────────────────────────

export function getGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(KEYS.SESSION)
    if (!raw) return null
    return JSON.parse(raw) as GuestSession
  } catch {
    return null
  }
}

export function saveGuestSession(session: GuestSession): void {
  try {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session))
  } catch {
    // SSR or storage unavailable
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEYS.SESSION)
  } catch {
    // SSR or storage unavailable
  }
}

// ── Language ──────────────────────────────────────────────────────────────────

export function getLang(): 'en' | 'zh' {
  try {
    const raw = localStorage.getItem(KEYS.LANG)
    if (raw === 'en' || raw === 'zh') return raw
    return 'zh'
  } catch {
    return 'zh'
  }
}

export function saveLang(lang: 'en' | 'zh'): void {
  try {
    localStorage.setItem(KEYS.LANG, lang)
  } catch {
    // SSR or storage unavailable
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
