export const FREE_DAILY_LIMIT = 2
export const PRO_PRICE_MONTHLY = 8 // HKD per month
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
