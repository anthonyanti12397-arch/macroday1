'use client'

import type { InBodyRecord, UserProfile, WeeklyPlan, UsageRecord, DailyMeals, GuestSession, TrainingRecord } from './types'

const KEYS = {
  INBODY_HISTORY: 'fuelweek_inbody_history',
  USER_PROFILE: 'fuelweek_user_profile',
  WEEKLY_PLAN: 'fuelweek_weekly_plan',
  USAGE: 'fuelweek_usage',
  SHOPPING_CHECKED: 'fuelweek_shopping_checked',
  DAILY_MEALS: 'fuelweek_daily_meals',
  SESSION: 'macroday_session',
  LANG: 'macroday_lang',
  MEAL_PLAN_CACHE: 'macroday_meal_plan_cache', // New key for hashed cache
  CLOUD_MIGRATION: 'macroday_cloud_migration_done',
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

export function addDislikedIngredients(ingredients: string[]): UserProfile | null {
  const profile = getUserProfile()
  if (!profile) return null
  const disliked = new Set([...(profile.dislikedIngredients ?? []), ...ingredients.map((i) => i.trim()).filter(Boolean)])
  const updated = { ...profile, dislikedIngredients: Array.from(disliked) }
  saveUserProfile(updated)
  return updated
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
    if (!raw) return { date: todayStr(), count: 0, adRewards: 0 }
    return JSON.parse(raw) as UsageRecord
  } catch {
    return { date: todayStr(), count: 0, adRewards: 0 }
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

export function addAdReward(): void {
  try {
    const usage = getTodayUsage()
    usage.adRewards = (usage.adRewards || 0) + 1
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
      localStorage.setItem(KEYS.USAGE, JSON.stringify({ date: todayStr(), count: 0, adRewards: 0 }))
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

// ── Cache by Stats Hash ────────────────────────────────────────────────────────
// This cache allows instant retrieval if the user's InBody/Profile haven't changed.

export function saveToStatsCache(hash: string, data: WeeklyPlan | DailyMeals): void {
  try {
    const raw = localStorage.getItem(KEYS.MEAL_PLAN_CACHE)
    const cache = raw ? JSON.parse(raw) : {}
    const now = Date.now()
    
    // GC old entries while saving
    for (const key of Object.keys(cache)) {
      if (now - cache[key].timestamp > 3 * 24 * 60 * 60 * 1000) {
        delete cache[key]
      }
    }
    
    cache[hash] = { data, timestamp: now }
    localStorage.setItem(KEYS.MEAL_PLAN_CACHE, JSON.stringify(cache))
  } catch {
    // Storage unavailable
  }
}


export function getFromStatsCache<T>(hash: string): T | null {
  try {
    const raw = localStorage.getItem(KEYS.MEAL_PLAN_CACHE)
    if (!raw) return null
    const cache = JSON.parse(raw)
    const item = cache[hash]
    if (!item) return null
    
    // Auto-expire after 3 days
    if (Date.now() - item.timestamp > 3 * 24 * 60 * 60 * 1000) {
      delete cache[hash]
      localStorage.setItem(KEYS.MEAL_PLAN_CACHE, JSON.stringify(cache))
      return null
    }
    
    return item.data as T
  } catch {
    return null
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

// ── Eaten Meals ───────────────────────────────────────────────────────────────

export function getEatenMeals(): string[] {
  try {
    const key = `macroday_eaten_${todayStr()}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export function toggleMealEaten(mealType: string): string[] {
  try {
    const key = `macroday_eaten_${todayStr()}`
    const current = getEatenMeals()
    const idx = current.indexOf(mealType)
    const updated = idx >= 0 ? current.filter((m) => m !== mealType) : [...current, mealType]
    localStorage.setItem(key, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export function getComplianceHistory(days = 30): Record<string, 'full' | 'partial' | 'none'> {
  const history: Record<string, 'full' | 'partial' | 'none'> = {}
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const key = `macroday_eaten_${ds}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const eaten = JSON.parse(raw) as string[]
        if (eaten.length >= 3) history[ds] = 'full'
        else if (eaten.length > 0) history[ds] = 'partial'
        else history[ds] = 'none'
      } else {
        history[ds] = 'none'
      }
    } catch {
      history[ds] = 'none'
    }
  }
  return history
}

export function hasCompletedMigration(): boolean {
  try {
    return localStorage.getItem(KEYS.CLOUD_MIGRATION) === '1'
  } catch {
    return false
  }
}

export function markMigrationComplete(): void {
  try {
    localStorage.setItem(KEYS.CLOUD_MIGRATION, '1')
  } catch {
    // ignore storage failures
  }
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export function getFavorites(): import('./types').Meal[] {
  try {
    const raw = localStorage.getItem('macroday_favorites')
    if (!raw) return []
    return JSON.parse(raw) as import('./types').Meal[]
  } catch {
    return []
  }
}

export function toggleFavorite(meal: import('./types').Meal): boolean {
  try {
    const favs = getFavorites()
    const exists = favs.some((f) => f.name === meal.name)
    const updated = exists ? favs.filter((f) => f.name !== meal.name) : [...favs, meal]
    localStorage.setItem('macroday_favorites', JSON.stringify(updated))
    return !exists
  } catch {
    return false
  }
}

export function isFavorite(mealName: string): boolean {
  return getFavorites().some((f) => f.name === mealName)
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
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Training ──────────────────────────────────────────────────────────────────

export function getTrainingHistory(): TrainingRecord[] {
  try {
    const raw = localStorage.getItem('fuelweek_training_history')
    if (!raw) return []
    return JSON.parse(raw) as TrainingRecord[]
  } catch {
    return []
  }
}

export function saveTrainingRecord(record: TrainingRecord): void {
  try {
    const history = getTrainingHistory()
    const idx = history.findIndex((r) => r.date === record.date)
    if (idx >= 0) {
      history[idx] = record
    } else {
      history.unshift(record)
    }
    // Keep max 90 days
    if (history.length > 90) history.length = 90
    localStorage.setItem('fuelweek_training_history', JSON.stringify(history))
  } catch {
    // SSR or storage unavailable
  }
}

// ── Avatar & MacroScore ───────────────────────────────────────────────────────

export function getMacroScore(): number {
  try {
    const raw = localStorage.getItem('macroday_score')
    if (!raw) return 0
    return parseInt(raw, 10) || 0
  } catch {
    return 0
  }
}

export function addMacroScore(points: number): void {
  try {
    const current = getMacroScore()
    localStorage.setItem('macroday_score', (current + points).toString())
  } catch {
    // SSR
  }
}

export function spendMacroScore(points: number): boolean {
  try {
    const current = getMacroScore()
    if (current < points) return false
    localStorage.setItem('macroday_score', (current - points).toString())
    return true
  } catch {
    return false
  }
}

export function getUnlockedParts(): string[] {
  try {
    const raw = localStorage.getItem('macroday_unlocked_parts')
    if (!raw) return ['head_none', 'top_basic_white', 'bottom_sweats_gray', 'acc_none']
    return JSON.parse(raw) as string[]
  } catch {
    return ['head_none', 'top_basic_white', 'bottom_sweats_gray', 'acc_none']
  }
}

export function unlockPart(id: string): void {
  try {
    const current = getUnlockedParts()
    if (!current.includes(id)) {
      current.push(id)
      localStorage.setItem('macroday_unlocked_parts', JSON.stringify(current))
    }
  } catch {
    // SSR
  }
}

export function getEquippedLoadout(): Record<string, string> {
  const defaultLoadout = {
    head: 'head_none',
    top: 'top_basic_white',
    bottom: 'bottom_sweats_gray',
    accessory: 'acc_none'
  }
  try {
    const raw = localStorage.getItem('macroday_equipped_loadout')
    if (!raw) {
      // Fallback migrating old `macroday_equipped_outfit`
      const oldRaw = localStorage.getItem('macroday_equipped_outfit')
      if (oldRaw === 'gym_black') return { head: 'head_none', top: 'top_tank_black', bottom: 'bottom_shorts_black', accessory: 'acc_none' }
      if (oldRaw === 'teal_pro') return { head: 'head_none', top: 'top_hoodie_teal', bottom: 'bottom_sweats_gray', accessory: 'acc_none' }
      if (oldRaw === 'fire_red') return { head: 'head_headband_red', top: 'top_basic_white', bottom: 'bottom_shorts_black', accessory: 'acc_flame' }
      if (oldRaw === 'galaxy') return { head: 'head_headphones', top: 'top_jacket_galaxy', bottom: 'bottom_pants_galaxy', accessory: 'acc_none' }
      return defaultLoadout
    }
    return JSON.parse(raw)
  } catch {
    return defaultLoadout
  }
}

export function setEquippedLoadout(loadout: Record<string, string>): void {
  try {
    localStorage.setItem('macroday_equipped_loadout', JSON.stringify(loadout))
  } catch {
    // SSR
  }
}

export function getLastStreakReward(): number {
  try {
    const raw = localStorage.getItem('macroday_last_streak_bonus')
    if (!raw) return 0
    return parseInt(raw, 10) || 0
  } catch {
    return 0
  }
}

export function setLastStreakReward(streakCount: number): void {
  try {
    localStorage.setItem('macroday_last_streak_bonus', streakCount.toString())
  } catch {
    // SSR
  }
}

// ── Starter Gear Logic ────────────────────────────────────────────────────────

export function isStarterGearReceived(): boolean {
  try {
    return localStorage.getItem('macroday_starter_received') === '1'
  } catch {
    return false
  }
}

export function checkAndInitStarterGear(gearDb: import('./outfits').GearPart[]): string[] | null {
  if (isStarterGearReceived()) return null

  try {
    // Select 2 random items from Common or Rare pools (excluding 'none')
    const pool = gearDb.filter(p => 
      (p.rarity === 'common' || p.rarity === 'rare') && 
      !p.id.endsWith('_none')
    )
    
    // Shuffle and pick 2
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    const starterItems = shuffled.slice(0, 2).map(p => p.id)
    
    const current = getUnlockedParts()
    const updated = Array.from(new Set([...current, ...starterItems]))
    
    localStorage.setItem('macroday_unlocked_parts', JSON.stringify(updated))
    localStorage.setItem('macroday_starter_received', '1')
    
    return starterItems
  } catch {
    return null
  }
}
