'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { getStreakData, type StreakData } from '@/lib/streak'
import { useLang } from '@/contexts/LangContext'
import { addMacroScore, getLastStreakReward, setLastStreakReward, unlockPart } from '@/lib/storage'
import { toast } from 'sonner'

export default function StreakBadge() {
  const { lang } = useLang()
  const [streak, setStreak] = useState<StreakData | null>(null)

  useEffect(() => {
    const s = getStreakData()
    setStreak(s)
    
    if (s && s.current > 0) {
      if (s.current % 7 === 0 && getLastStreakReward() !== s.current) {
        addMacroScore(50)
        setLastStreakReward(s.current)
        toast.success(lang === 'zh' ? '🏆 +50 分！達成 7 天連勝' : '🏆 +50 pts! 7-day streak')
      }
      if (s.current >= 30) {
        unlockPart('streak_legend')
      }
    }
  }, [lang])

  if (!streak || streak.current === 0) return null

  const isHot = streak.current >= 3

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
        isHot
          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 border border-orange-100 dark:border-orange-800/40'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
      }`}
    >
      <Flame
        size={13}
        className={isHot ? 'text-orange-500' : 'text-slate-400'}
        fill={isHot ? '#f97316' : 'none'}
      />
      <span>
        {streak.current}
        {lang === 'zh' ? ' 天連續' : ' day streak'}
      </span>
    </div>
  )
}
