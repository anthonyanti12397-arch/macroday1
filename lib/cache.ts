/**
 * Simple client-side cache utility to improve perceived performance 
 * and reduce redundant processing/API calls.
 */

const CACHE_PREFIX = 'macroday_cache_';
const DEFAULT_TTL = 1000 * 60 * 30; // 30 minutes

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL) {
  if (typeof window === 'undefined') return;
  
  const cacheItem = {
    data,
    expiry: Date.now() + ttl,
  };
  
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  const raw = localStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;
  
  try {
    const item = JSON.parse(raw);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return item.data as T;
  } catch (e) {
    return null;
  }
}

export function clearCache(key?: string) {
  if (typeof window === 'undefined') return;
  
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  } else {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
}

const memoryCache: Record<string, { data: any; expiry: number }> = {};

export function setMemoryCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL) {
  memoryCache[key] = {
    data,
    expiry: Date.now() + ttl,
  };
}

export function getMemoryCache<T>(key: string): T | null {
  const item = memoryCache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete memoryCache[key];
    return null;
  }
  return item.data as T;
}

export function generateStatsHash(inbody: any, profile: any, lang: string): string {
  if (!inbody || !profile) return 'default';
  // Simple deterministic hash based on core metrics to identify if plan needs regeneration
  const str = `${inbody.weight}-${inbody.height}-${inbody.age}-${profile.goal}-${profile.activityLevel || ''}-${lang}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h' + Math.abs(hash).toString(16);
}

export function saveToStatsCache<T>(key: string, data: T) {
  setCache(key, data);
}

export function getFromStatsCache<T>(key: string): T | null {
  return getCache(key);
}
