import { BETA_MODE, FREE_DAILY_LIMIT } from '@/lib/constants'

export type ProFeature =
  | 'weekly-plan'
  | 'progress-charts'
  | 'forum-post'
  | 'forum-reply'
  | 'regional-prompts'
  | 'unlimited-swap'
  | 'cloud-sync'

export interface GateContext {
  isPro?: boolean
  hasAdFree?: boolean
  dailyUsageCount?: number
}

export function isProUser(isPro?: boolean): boolean {
  return BETA_MODE || !!isPro
}

export function canUseFeature(feature: ProFeature, context: GateContext = {}): boolean {
  if (BETA_MODE) return true
  const pro = !!context.isPro

  switch (feature) {
    case 'forum-post':
    case 'regional-prompts':
    case 'unlimited-swap':
    case 'weekly-plan':
    case 'progress-charts':
    case 'cloud-sync':
      return pro
    case 'forum-reply':
      return pro
    default:
      return false
  }
}

export function canGenerateDaily(context: GateContext = {}): boolean {
  if (isProUser(context.isPro)) return true
  return (context.dailyUsageCount ?? 0) < FREE_DAILY_LIMIT
}

export function shouldShowBannerAds(context: GateContext = {}): boolean {
  if (BETA_MODE) return false
  if (isProUser(context.isPro)) return false
  if (context.hasAdFree === true) return false
  return true
}
