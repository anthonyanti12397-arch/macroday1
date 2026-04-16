import type { InBodyRecord, UserProfile } from './types'
import { Session } from 'next-auth'

/**
 * Normalize goal value from API/DB to valid UserProfile goal type
 */
export function normalizeGoal(goal: string | undefined): 'muscle_gain' | 'fat_loss' | 'maintain' {
  if (goal === 'maintenance') return 'maintain'
  if (goal === 'muscle_gain' || goal === 'fat_loss') return goal
  return 'maintain'
}

/**
 * Transform partial InBody data to complete InBodyRecord with temp ID and date
 */
export function hydrateInBodyRecord(inbody: {
  weight: number
  height: number
  gender: 'male' | 'female'
  age: number
  bodyFat?: number | null
  skeletalMuscleMass?: number | null
  bmr?: number | null
  visceralFatLevel?: number | null
}): InBodyRecord {
  const now = new Date()
  return {
    weight: inbody.weight,
    height: inbody.height,
    gender: inbody.gender,
    age: inbody.age,
    bodyFat: inbody.bodyFat ?? undefined,
    skeletalMuscleMass: inbody.skeletalMuscleMass ?? undefined,
    bmr: inbody.bmr ?? undefined,
    visceralFatLevel: inbody.visceralFatLevel ?? undefined,
    id: `temp-${now.getTime()}`,
    date: now.toISOString().split('T')[0],
  }
}

/**
 * Normalize user profile with defaults and auth status
 */
export function normalizeUserProfile(
  profile: {
    goal: string
    activityLevel: string
    dietaryRestrictions: string[]
    proteinPreferences?: string[]
    carbPreferences?: string[]
    cuisinePreferences?: string[]
  },
  options: {
    isTakeoutMode?: boolean
    isAuthed?: boolean
  } = {}
): UserProfile {
  return {
    goal: normalizeGoal(profile.goal),
    activityLevel: profile.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    dietaryRestrictions: profile.dietaryRestrictions ?? [],
    proteinPreferences: profile.proteinPreferences ?? [],
    carbPreferences: profile.carbPreferences ?? [],
    cuisinePreferences: profile.cuisinePreferences ?? [],
    cookingStyle: options.isTakeoutMode ? 'takeout' : 'home',
    isPro: options.isAuthed ?? false,
    isAdFree: options.isAuthed ?? false,
  }
}

/**
 * Format optional string array as comma-separated string
 * @param arr - Array to format (or undefined)
 * @param limit - Max items to include
 * @param fallback - Default value if empty
 */
export function formatArrayAsString(
  arr: string[] | undefined,
  limit?: number,
  fallback = 'any'
): string {
  if (!arr || arr.length === 0) return fallback
  const items = limit ? arr.slice(0, limit) : arr
  return items.join(', ')
}
