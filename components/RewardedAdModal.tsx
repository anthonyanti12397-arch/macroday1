'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayCircle, ShieldCheck, X } from 'lucide-react'
import { addAdReward } from '@/lib/storage'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'
import { isAdMobAvailable, showRewardedAd } from '@/lib/admob'

interface RewardedAdModalProps {
  onClose: () => void
  onSuccess: () => void
}

/**
 * Rewarded ad flow. On the native app this shows a REAL AdMob rewarded video and
 * only grants quota when the user actually earns the reward — that's what makes
 * the ad-supported model balance (the ad pays for the generation it unlocks).
 *
 * Web has no true rewarded ad format, so there it falls back to a short timed
 * placeholder purely so the flow is testable in the browser.
 */
export default function RewardedAdModal({ onClose, onSuccess }: RewardedAdModalProps) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const native = isAdMobAvailable()

  const [timeLeft, setTimeLeft] = useState(5)
  const [rewardGranted, setRewardGranted] = useState(false)
  const [failed, setFailed] = useState(false)
  const startedRef = useRef(false)

  // ── Native: real AdMob rewarded video ──
  useEffect(() => {
    if (!native || startedRef.current) return
    startedRef.current = true

    let cancelled = false
    ;(async () => {
      const earned = await showRewardedAd()
      if (cancelled) return
      if (earned) {
        addAdReward()
        setRewardGranted(true)
        toast.success(zh ? '獲得 1 次額外配額！' : 'Earned 1 extra quota!')
        onSuccess()
      } else {
        // Dismissed early or no ad available — grant nothing.
        setFailed(true)
        toast.error(zh ? '未看完廣告，未取得配額' : 'Ad not completed — no quota granted')
        onClose()
      }
    })()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native])

  // ── Web fallback: timed placeholder so the flow is testable ──
  useEffect(() => {
    if (native || rewardGranted) return
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((l) => l - 1), 1000)
      return () => clearTimeout(timer)
    }
    setRewardGranted(true)
    addAdReward()
    toast.success(zh ? '獲得 1 次額外配額！' : 'Earned 1 extra quota!')
    onSuccess()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native, timeLeft, rewardGranted])

  // While the native ad is on screen AdMob covers the app, so keep this minimal.
  if (native && !rewardGranted) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
        <PlayCircle size={48} className="text-zinc-600 mb-4 animate-pulse" />
        <p className="text-zinc-300 font-semibold">
          {failed
            ? (zh ? '廣告未完成' : 'Ad not completed')
            : (zh ? '正在載入廣告…' : 'Loading ad…')}
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Web placeholder ad surface */}
      <div className="w-full max-w-md aspect-video bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-2xl">
        <PlayCircle size={48} className="text-zinc-700 mb-4 animate-pulse" />
        <p className="text-zinc-500 font-semibold mb-1">
          {zh ? '贊助商廣告展示中' : 'Sponsored Ad Playing'}
        </p>
        <p className="text-zinc-600 text-xs">
          {zh ? '(網頁版示意；App 版為真實廣告)' : '(web preview; real ads in the app)'}
        </p>

        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
            <ShieldCheck size={14} className="text-[#0BD68A]" />
            <span className="text-xs text-white font-medium">Safe Ad</span>
          </div>

          {rewardGranted ? (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
            >
              <X size={16} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
              {timeLeft}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
          <div
            className="h-full bg-[#0F9E75] transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">
          {rewardGranted
            ? (zh ? '獎勵已發放！' : 'Reward Granted!')
            : (zh ? '觀看廣告以解鎖配額' : 'Watch ad to unlock quota')}
        </h3>
        <p className="text-zinc-400 text-sm max-w-[280px] mx-auto leading-relaxed">
          {rewardGranted
            ? (zh ? '你現在可以繼續使用 AI 生成功能了。' : 'You can now continue using AI generation features.')
            : (zh ? '請看完這段短片，即可免費獲得 1 次 AI 運算配額。' : 'Watch this short video to earn 1 free AI generation quota.')}
        </p>
      </div>

      {rewardGranted && (
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3.5 bg-[#0F9E75] text-white font-bold rounded-2xl hover:bg-[#0BD68A] transition-colors active:scale-95"
        >
          {zh ? '繼續使用' : 'Continue'}
        </button>
      )}
    </div>
  )
}
