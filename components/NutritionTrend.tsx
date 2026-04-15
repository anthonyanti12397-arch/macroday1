'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { getComplianceHistory } from '@/lib/storage'
import { useLang } from '@/contexts/LangContext'
import { useTheme } from '@/contexts/ThemeContext'

type DayStatus = 'full' | 'partial' | 'none'

interface DayBar {
  label: string
  status: DayStatus
  isToday: boolean
}

export default function NutritionTrend() {
  const { lang } = useLang()
  const { isDark } = useTheme()
  const [bars, setBars] = useState<DayBar[]>([])

  useEffect(() => {
    const history = getComplianceHistory(7)
    const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayLabelsZh = ['日', '一', '二', '三', '四', '五', '六']
    const now = new Date(); const todayDs = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const result: DayBar[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const labels = lang === 'zh' ? dayLabelsZh : dayLabelsEn
      result.push({
        label: labels[d.getDay()],
        status: history[ds] ?? 'none',
        isToday: ds === todayDs,
      })
    }
    setBars(result)
  }, [lang])

  const fullCount = bars.filter(b => b.status === 'full').length
  const pct = bars.length > 0 ? Math.round((fullCount / bars.length) * 100) : 0

  const barColor = (status: DayStatus) => {
    if (status === 'full') return '#0F9E75'
    if (status === 'partial') return '#E09B20'
    return isDark ? '#475569' : '#E2E8F0'
  }

  const barHeight = (status: DayStatus) => {
    if (status === 'full') return '100%'
    if (status === 'partial') return '55%'
    return '20%'
  }

  if (bars.length === 0) return null

  return (
    <div className="card-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[#0F9E75]" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'zh' ? '7 天達成率' : '7-Day Compliance'}
          </p>
        </div>
        <span className="text-sm font-bold text-[#0F9E75]">{pct}%</span>
      </div>

      <div className="flex items-end gap-1.5 h-16">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: barHeight(bar.status),
                  background: barColor(bar.status),
                  opacity: bar.isToday ? 1 : 0.75,
                  outline: bar.isToday ? '2px solid #0F9E75' : 'none',
                  outlineOffset: '2px',
                }}
              />
            </div>
            <span
              className="text-[9px] font-bold"
              style={{ color: bar.isToday ? '#0F9E75' : '#94A3B8' }}
            >
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-3">
        {[
          { color: '#0F9E75', label: lang === 'zh' ? '三餐完成' : 'All 3 meals' },
          { color: '#E09B20', label: lang === 'zh' ? '部分完成' : 'Partial' },
          { color: isDark ? '#475569' : '#E2E8F0', label: lang === 'zh' ? '未記錄' : 'None' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
            <span className="text-[9px] font-semibold text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
