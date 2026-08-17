import { BETA_MODE, FREE_DAILY_LIMIT, MAX_AD_REWARDS_PER_DAY, PRO_DAILY_CAP } from '@/lib/constants'

/**
 * Ad-supported model (no paid tier).
 *
 * Revenue comes from ads, not subscriptions, so every FEATURE is free — gating
 * features behind `isPro` would make them permanently unreachable now that
 * there's no way to buy Pro.
 *
 * What's still limited is AI GENERATION VOLUME, because that's the only real
 * cost. Everyone gets a small daily allowance funded by banner impressions, and
 * beyond that each extra generation must be unlocked by a rewarded ad view —
 * which pays for that generation. Cost therefore can't outrun ad revenue.
 *
 * The isPro / hasAdFree flags are kept so any legacy subscriber keeps an ad-free
 * experience, and so paid tiers can be re-enabled without a rewrite.
 */

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

/**
 * All features are available to everyone in the ad-supported model.
 * Kept as a function (rather than deleting call sites) so tiering can return.
 */
export function canUseFeature(_feature: ProFeature, _context: GateContext = {}): boolean {
  return true
}

/** Daily generation allowance, including quota earned from rewarded ads. */
export function dailyGenerationLimit(context: GateContext = {}): number {
  if (isProUser(context.isPro)) return PRO_DAILY_CAP
  const earned = Math.min(context.adRewards ?? 0, MAX_AD_REWARDS_PER_DAY)
  return FREE_DAILY_LIMIT + earned
}

export function canGenerateDaily(context: GateContext = {}): boolean {
  if (BETA_MODE) return true
  const used = context.dailyUsageCount ?? 0
  return used < dailyGenerationLimit(context)
}

/** True when the user can still earn more quota by watching an ad today. */
export function canEarnMoreQuota(context: GateContext = {}): boolean {
  if (isProUser(context.isPro)) return false
  return (context.adRewards ?? 0) < MAX_AD_REWARDS_PER_DAY
}

export function shouldShowBannerAds(context: GateContext = {}): boolean {
  if (BETA_MODE) return false
  if (isProUser(context.isPro)) return false
  if (context.hasAdFree === true) return false
  return true
}
