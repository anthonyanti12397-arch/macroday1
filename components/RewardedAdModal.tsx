'use client'

import { useEffect, useState } from 'react'
import { PlayCircle, ShieldCheck, X } from 'lucide-react'
import { addAdReward } from '@/lib/storage'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'

interface RewardedAdModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function RewardedAdModal({ onClose, onSuccess }: RewardedAdModalProps) {
  const [timeLeft, setTimeLeft] = useState(5)
  const [rewardGranted, setRewardGranted] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(l => l - 1), 1000)
      return () => clearTimeout(timer)
    } else if (!rewardGranted) {
      setRewardGranted(true)
      addAdReward()
      toast.success(lang === 'zh' ? '獲得 1 次額外配額！' : 'Earned 1 extra quota!')
      onSuccess()
    }
  }, [timeLeft, rewardGranted, onSuccess, lang])

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Mock Ad Video Area */}
      <div className="w-full max-w-md aspect-video bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-2xl">
        <PlayCircle size={48} className="text-zinc-700 mb-4 animate-pulse" />
        <p className="text-zinc-500 font-semibold mb-1">
          {lang === 'zh' ? '贊助商廣告展示中' : 'Sponsored Ad Playing'}
        </p>
        <p className="text-zinc-600 text-xs">
          {lang === 'zh' ? '(Google AdSense Rewarded Placeholder)' : '(Google AdSense Rewarded Placeholder)'}
        </p>

        {/* Top bar layer */}
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

        {/* Progress bar */}
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
            ? (lang === 'zh' ? '獎勵已發放！' : 'Reward Granted!') 
            : (lang === 'zh' ? '觀看廣告以解鎖配額' : 'Watch ad to unlock quota')}
        </h3>
        <p className="text-zinc-400 text-sm max-w-[280px] mx-auto leading-relaxed">
          {rewardGranted 
            ? (lang === 'zh' ? '你現在可以繼續使用 AI 生成功能了。' : 'You can now continue using AI generation features.')
            : (lang === 'zh' ? '請看完這段短片，即可免費獲得 1 次 AI 運算配額。' : 'Watch this short video to earn 1 free AI generation quota.')}
        </p>
      </div>

      {rewardGranted && (
        <button
          onClick={onClose}
          className="mt-8 px-8 py-3.5 bg-[#0F9E75] text-white font-bold rounded-2xl hover:bg-[#0BD68A] transition-colors active:scale-95"
        >
          {lang === 'zh' ? '繼續使用' : 'Continue'}
        </button>
      )}
    </div>
  )
}
