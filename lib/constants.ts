export const FREE_DAILY_LIMIT = 2
// Free users can earn up to this many extra generations/day by watching rewarded ads.
export const MAX_AD_REWARDS_PER_DAY = 5
// Fair-use ceiling for paid users — keeps API cost bounded against abuse while
// staying high enough to feel unlimited for normal use.
export const PRO_DAILY_CAP = 20
// Plus tier pricing (USD). Annual is ~2 months free vs monthly, and amortizes
// Stripe's fixed per-charge fee (which is brutal on a $2 monthly charge).
export const PRO_PRICE_MONTHLY = 2   // USD / month
export const PRO_PRICE_ANNUAL = 20   // USD / year
export const PRO_CURRENCY = 'usd'
export const APP_NAME = 'MacroDay'
export const APP_NAME_ZH = '每日燃'
// grok-4 quality without the slow reasoning chain — benchmarked at ~3s for meal
// gen (vs grok-3-mini ~9s, grok-4.3 ~14s) with more varied, on-target meals.
export const GROK_MODEL = 'grok-4.20-0309-non-reasoning'
// Bumped from v2-regional: prompts now feed full body composition + goal context.
export const PROMPT_VERSION = 'v3-bodyaware'
export const PRO_TRIAL_DAYS = 14

// Phase 4: Pro gating is live.
export const BETA_MODE = false

// Google AdSense (web banner ads). The publisher account already exists; set the
// banner ad-unit slot id to actually serve ads. Until a slot is set, AdBanner
// renders a dev placeholder. Rewarded video (watch-ad-for-quota) is not real on
// web — it needs AdMob in the native (Capacitor) app.
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? 'ca-pub-3028542923682031'
export const ADSENSE_SLOT_BANNER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? ''
