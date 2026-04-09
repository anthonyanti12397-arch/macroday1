'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { getStreakData, type StreakData } from '@/lib/streak'
import { useLang } from '@/contexts/LangContext'

export default function StreakBadge() {
  const { lang } = useLang()
  const [streak, setStreak] = useState<StreakData | null>(null)

  useEffect(() => {
    setStreak(getStreakData())
  }, [])

  if (!streak || streak.current === 0) return null

  const isHot = streak.current >= 3

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
        isHot
          ? 'bg-orange-50 text-orange-500 border border-orange-100'
          : 'bg-slate-100 text-slate-500 border border-slate-200'
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
