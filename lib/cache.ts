/**
 * Cache utility to generate unique keys for meal plans based on user stats.
 * This helps in skipping AI generation if stats haven't changed significantly.
 */

import type { InBodyRecord, UserProfile } from './types';

export function generateStatsHash(inbody: InBodyRecord, profile: UserProfile, lang: string): string {
  // We use key metrics that would actually change the meal plan outcome.
  // We round weight to 0.5kg to allow for minor fluctuations without invalidating cache.
  const roundedWeight = Math.round(inbody.weight * 2) / 2;
  const roundedBodyFat = inbody.bodyFat ? Math.round(inbody.bodyFat) : 'none';
  
  const components = [
    roundedWeight,
    roundedBodyFat,
    inbody.gender,
    inbody.age,
    profile.goal,
    profile.dietaryRestrictions.sort().join(','),
    (profile.cuisinePreferences ?? []).sort().join(','),
    lang
  ];
  
  return components.join('|');
}

// Memory cache to avoid even localStorage hits when navigating within the app.
const memoryCache: Record<string, any> = {};

export function setMemoryCache(key: string, data: any) {
  memoryCache[key] = data;
}

export function getMemoryCache(key: string) {
  return memoryCache[key] || null;
}
