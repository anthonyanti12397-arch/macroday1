import { BETA_MODE, FREE_DAILY_LIMIT, MAX_AD_REWARDS_PER_DAY, PRO_DAILY_CAP } from '@/lib/constants'

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
  /** Extra generations earned today by watching rewarded ads. */
  adRewards?: number
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
  if (BETA_MODE) return true
  const used = context.dailyUsageCount ?? 0
  // Paid users: effectively unlimited, but capped for fair use / API-cost control.
  if (isProUser(context.isPro)) return used < PRO_DAILY_CAP
  // Free users: base quota + generations earned by watching rewarded ads (capped).
  const earned = Math.min(context.adRewards ?? 0, MAX_AD_REWARDS_PER_DAY)
  return used < FREE_DAILY_LIMIT + earned
}

export function shouldShowBannerAds(context: GateContext = {}): boolean {
  if (BETA_MODE) return false
  if (isProUser(context.isPro)) return false
  if (context.hasAdFree === true) return false
  return true
}
