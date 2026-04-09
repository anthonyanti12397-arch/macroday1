'use client'

import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { getComplianceHistory } from '@/lib/storage'
import { useLang } from '@/contexts/LangContext'

interface Insights {
  compliancePct: number
  fullDays: number
  partialDays: number
  bestStreak: number
}

function calcInsights(days = 7): Insights {
  const history = getComplianceHistory(days)
  const entries = Object.values(history)
  const fullDays = entries.filter(v => v === 'full').length
  const partialDays = entries.filter(v => v === 'partial').length
  const compliancePct = entries.length > 0 ? Math.round((fullDays / entries.length) * 100) : 0

  // Best streak in period
  let streak = 0, best = 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (history[ds] === 'full') { streak++; best = Math.max(best, streak) }
    else streak = 0
  }

  return { compliancePct, fullDays, partialDays, bestStreak: best }
}

export default function WeeklyInsights() {
  const { lang } = useLang()
  const [ins, setIns] = useState<Insights | null>(null)

  useEffect(() => {
    setIns(calcInsights(7))
  }, [])

  if (!ins || (ins.fullDays === 0 && ins.partialDays === 0)) return null

  const stats = [
    {
      value: `${ins.compliancePct}%`,
      label: lang === 'zh' ? '7天達成率' : '7-day rate',
      color: ins.compliancePct >= 70 ? '#0F9E75' : ins.compliancePct >= 40 ? '#E09B20' : '#D85A30',
    },
    {
      value: ins.fullDays,
      label: lang === 'zh' ? '三餐完成天' : 'Full days',
      color: '#0F9E75',
    },
    {
      value: ins.bestStreak,
      label: lang === 'zh' ? '最長連續' : 'Best streak',
      color: '#7F77DD',
    },
  ]

  return (
    <div className="card-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={14} className="text-[#0F9E75]" />
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          {lang === 'zh' ? '本週洞察' : 'Weekly Insights'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ value, label, color }) => (
          <div key={label} className="text-center bg-slate-50 rounded-2xl p-3">
            <p className="text-2xl font-black leading-none mb-1" style={{ color }}>{value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>
      {ins.compliancePct >= 80 && (
        <p className="text-xs text-center text-[#0F9E75] font-bold mt-3">
          {lang === 'zh' ? '🔥 你本週表現出色！繼續保持' : '🔥 Outstanding week! Keep it up'}
        </p>
      )}
      {ins.compliancePct < 40 && (
        <p className="text-xs text-center text-slate-400 mt-3">
          {lang === 'zh' ? '💪 每天記錄三餐，養成好習慣' : '💪 Log 3 meals daily to build consistency'}
        </p>
      )}
    </div>
  )
}
