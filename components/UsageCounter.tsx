'use client'

import { useEffect, useState } from 'react'
import { getTodayUsage } from '@/lib/storage'
import { FREE_DAILY_LIMIT, BETA_MODE } from '@/lib/constants'
import Link from 'next/link'
import { Zap, Sparkles, PlayCircle } from 'lucide-react'
import RewardedAdModal from './RewardedAdModal'
import { useLang } from '@/contexts/LangContext'

export default function UsageCounter() {
  const [count, setCount] = useState(0)
  const [adRewards, setAdRewards] = useState(0)
  const [showAd, setShowAd] = useState(false)
  const { lang } = useLang()

  const loadUsage = () => {
    const u = getTodayUsage()
    setCount(u.count)
    setAdRewards(u.adRewards || 0)
  }

  useEffect(() => { loadUsage() }, [])

  if (BETA_MODE) {
    return (
      <div className="card p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#E8F5F0]">
          <Sparkles size={15} className="text-[#0F9E75]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-800">MacroDay Beta</span>
            <span className="text-[10px] font-bold text-[#0F9E75] bg-[#E8F5F0] px-2 py-0.5 rounded-md">
              Unlimited
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Enjoy full features during the beta!</p>
        </div>
      </div>
    )
  }

  const currentLimit = FREE_DAILY_LIMIT + adRewards
  const atLimit = count >= currentLimit
  const pct = Math.min(100, (count / currentLimit) * 100)

  return (
    <>
      <div className={`card p-3.5 flex items-center gap-3 ${atLimit ? 'border-red-100' : ''}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${atLimit ? 'bg-red-50' : 'bg-[#E8F5F0]'}`}>
          <Zap size={15} className={atLimit ? 'text-red-500' : 'text-[#0F9E75]'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">
              {lang === 'zh' ? '免費每日配額' : 'Free daily recipes'}
            </span>
            <span className={`text-xs font-bold ${atLimit ? 'text-red-500' : 'text-slate-500'}`}>
              {count}/{currentLimit}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-400' : 'bg-gradient-to-r from-[#0F9E75] to-[#0BD68A]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {atLimit && adRewards < 5 && (
            <button 
              onClick={(e) => { e.preventDefault(); setShowAd(true); }}
              className="flex items-center gap-1 text-[10px] font-bold text-[#0F9E75] bg-[#E8F5F0] hover:bg-[#D1EBE1] transition-colors px-2.5 py-1.5 rounded-lg"
            >
              <PlayCircle size={12} />
              {lang === 'zh' ? '看廣告 +1' : 'Watch Ad (+1)'}
            </button>
          )}
          {atLimit && (
            <Link href="#upgrade" className="text-[10px] font-bold text-white bg-[#7F77DD] px-2.5 py-1.5 rounded-lg">
              {lang === 'zh' ? '升級' : 'Upgrade'}
            </Link>
          )}
        </div>
      </div>

      {showAd && (
        <RewardedAdModal 
          onClose={() => setShowAd(false)}
          onSuccess={() => {
            loadUsage()
            setShowAd(false)
          }}
        />
      )}
    </>
  )
}
