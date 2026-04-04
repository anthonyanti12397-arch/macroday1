'use client'

import { useEffect, useState } from 'react'
import { getTodayUsage } from '@/lib/storage'
import { FREE_DAILY_LIMIT } from '@/lib/constants'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function UsageCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => { setCount(getTodayUsage().count) }, [])

  const atLimit = count >= FREE_DAILY_LIMIT
  const pct = Math.min(100, (count / FREE_DAILY_LIMIT) * 100)

  return (
    <div className={`card p-3.5 flex items-center gap-3 ${atLimit ? 'border-red-100' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${atLimit ? 'bg-red-50' : 'bg-[#E8F5F0]'}`}>
        <Zap size={15} className={atLimit ? 'text-red-500' : 'text-[#0F9E75]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">Free daily recipes</span>
          <span className={`text-xs font-bold ${atLimit ? 'text-red-500' : 'text-slate-500'}`}>
            {count}/{FREE_DAILY_LIMIT}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-red-400' : 'bg-gradient-to-r from-[#0F9E75] to-[#0BD68A]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {atLimit && (
        <Link href="#upgrade" className="shrink-0 text-[10px] font-bold text-white bg-[#7F77DD] px-2.5 py-1.5 rounded-lg">
          Upgrade
        </Link>
      )}
    </div>
  )
}
