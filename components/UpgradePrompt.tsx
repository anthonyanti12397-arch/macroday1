'use client'

import { useState } from 'react'
import { X, PlayCircle, Clock, Sparkles } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { getTodayUsage, getUserProfile } from '@/lib/storage'
import { canEarnMoreQuota } from '@/lib/featureGate'
import { MAX_AD_REWARDS_PER_DAY } from '@/lib/constants'
import RewardedAdModal from './RewardedAdModal'

interface UpgradePromptProps {
  onClose: () => void
  /** Called once extra quota has been earned, so the caller can retry the action. */
  onUpgrade: () => void
}

/**
 * Shown when the daily generation allowance runs out.
 *
 * MacroDay is ad-supported: there is no paid tier, so instead of a paywall this
 * offers a rewarded ad — watching one unlocks another generation, and the ad
 * revenue covers that generation's API cost.
 */
export default function UpgradePrompt({ onClose, onUpgrade }: UpgradePromptProps) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const [showAd, setShowAd] = useState(false)

  const usage = getTodayUsage()
  const profile = getUserProfile()
  const canEarn = canEarnMoreQuota({ isPro: profile?.isPro, adRewards: usage.adRewards })
  const earnedToday = usage.adRewards ?? 0

  if (showAd) {
    return (
      <RewardedAdModal
        onClose={() => setShowAd(false)}
        onSuccess={() => { setShowAd(false); onUpgrade() }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label={zh ? '關閉' : 'Close'}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-[#0F9E75]" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {zh ? '今日配額已用完' : "Today's quota is used up"}
          </h2>
        </div>

        {canEarn ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {zh
                ? '看一段短廣告，即可再生成 1 次。廣告收入用來支付 AI 運算費用，讓 MacroDay 保持免費。'
                : 'Watch a short ad to unlock one more generation. Ad revenue covers the AI cost, which keeps MacroDay free.'}
            </p>

            <button
              onClick={() => setShowAd(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black active:scale-[0.99] transition-transform"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
            >
              <PlayCircle size={18} />
              {zh ? '看廣告 +1 次' : 'Watch ad for +1'}
            </button>

            <p className="text-center text-[11px] text-slate-400 mt-3">
              {zh
                ? `今日已透過廣告獲得 ${earnedToday}/${MAX_AD_REWARDS_PER_DAY} 次`
                : `Earned ${earnedToday}/${MAX_AD_REWARDS_PER_DAY} via ads today`}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 my-4">
              <Clock size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {zh
                  ? '你已用完今日全部配額（含廣告獎勵）。明天會重置，到時可以再生成。'
                  : "You've used today's full allowance, including ad rewards. It resets tomorrow."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold active:scale-[0.99] transition-transform"
            >
              {zh ? '明天再來' : 'Come back tomorrow'}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1.5"
        >
          {zh ? '稍後再說' : 'Maybe later'}
        </button>
      </div>
    </div>
  )
}
