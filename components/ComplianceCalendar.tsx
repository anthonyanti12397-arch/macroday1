'use client'

import { useState, useEffect } from 'react'
import { getComplianceHistory } from '@/lib/storage'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, AlertCircle, Info } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function ComplianceCalendar() {
  const { lang } = useLang()
  const [history, setHistory] = useState<Record<string, 'full' | 'partial' | 'none'>>({})
  const [stats, setStats] = useState({ full: 0, partial: 0 })

  useEffect(() => {
    const h = getComplianceHistory(35) // 5 weeks
    setHistory(h)
    
    const hValues = Object.values(h)
    setStats({
      full: hValues.filter(v => v === 'full').length,
      partial: hValues.filter(v => v === 'partial').length
    })
  }, [])

  const days = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { date: d, ds, status: history[ds] || 'none' }
  })

  const dayLabels = lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="card-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          {lang === 'zh' ? '目標達成日曆' : 'Compliance Calendar'}
          <div className="group relative">
            <Info size={14} className="text-slate-300 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {lang === 'zh' ? '全綠代表今日 3 餐均已完成。' : 'Green indicates all 3 meals completed today.'}
            </div>
          </div>
        </h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#0F9E75]" title="Full" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{stats.full}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E09B20]" title="Partial" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{stats.partial}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map(l => (
          <div key={l} className="text-[10px] font-black text-slate-300 dark:text-slate-500 text-center uppercase">{l}</div>
        ))}
        {days.map((day, idx) => {
          const today = new Date(); const isToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` === day.ds
          return (
            <motion.div
              key={day.ds}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.01 }}
              className={`aspect-square rounded-lg flex items-center justify-center relative overflow-hidden ${
                day.status === 'full' ? 'bg-[#0F9E75]/10 border border-[#0F9E75]/20' :
                day.status === 'partial' ? 'bg-[#E09B20]/10 border border-[#E09B20]/20' :
                'bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600'
              } ${isToday ? 'ring-2 ring-[#0F9E75]/40' : ''}`}
            >
              {day.status === 'full' && <CheckCircle2 size={12} className="text-[#0F9E75]" />}
              {day.status === 'partial' && <Circle size={10} className="text-[#E09B20] fill-[#E09B20]/20" />}
              {day.status === 'none' && <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-500" />}
              
              <span className="absolute top-0.5 right-1 text-[7px] font-black text-slate-400/30">
                {day.date.getDate()}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
