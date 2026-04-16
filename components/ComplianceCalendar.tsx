'use client'

import { useState, useEffect } from 'react'
import { getComplianceHistory } from '@/lib/storage'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function ComplianceCalendar() {
  const { lang } = useLang()
  const [history, setHistory] = useState<Record<string, 'full' | 'partial' | 'none'>>({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState({ full: 0, partial: 0, total: 0 })

  useEffect(() => {
    // Get 365 days of history for full year view
    const h = getComplianceHistory(365)
    setHistory(h)

    const hValues = Object.values(h)
    setStats({
      full: hValues.filter(v => v === 'full').length,
      partial: hValues.filter(v => v === 'partial').length,
      total: hValues.length
    })
  }, [])

  // Get calendar days for the current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const calendarDays: (Date | null)[] = []
  // Add empty slots for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i))
  }

  const dayLabels = lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabels = lang === 'zh'
    ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getDateStatus = (date: Date | null): 'full' | 'partial' | 'none' => {
    if (!date) return 'none'
    const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return history[ds] || 'none'
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="card-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {lang === 'zh' ? '📅 目標達成日曆' : '📅 Compliance Calendar'}
            <div className="group relative">
              <Info size={14} className="text-slate-300 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {lang === 'zh' ? '綠色 = 全部完成 | 橙色 = 部分完成' : 'Green = Full | Orange = Partial'}
              </div>
            </div>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {monthLabels[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0F9E75]/10 rounded-xl p-3 text-center border border-[#0F9E75]/20">
          <p className="text-sm font-bold text-[#0F9E75]">{stats.full}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{lang === 'zh' ? '完全達成' : 'Full'}</p>
        </div>
        <div className="bg-[#E09B20]/10 rounded-xl p-3 text-center border border-[#E09B20]/20">
          <p className="text-sm font-bold text-[#E09B20]">{stats.partial}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{lang === 'zh' ? '部分完成' : 'Partial'}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-600">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.total}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{lang === 'zh' ? '總天數' : 'Total'}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-2">
          {dayLabels.map(l => (
            <div key={l} className="text-xs font-black text-slate-400 dark:text-slate-500 text-center py-2 border-b border-slate-200 dark:border-slate-700">
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const status = getDateStatus(day)
            const isToday = day && todayStr === `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                className={`aspect-square rounded-xl flex items-center justify-center relative font-semibold text-sm transition-all ${
                  !day ? 'bg-transparent' :
                  status === 'full' ? 'bg-[#0F9E75]/15 text-[#0F9E75] border border-[#0F9E75]/30 shadow-sm' :
                  status === 'partial' ? 'bg-[#E09B20]/15 text-[#E09B20] border border-[#E09B20]/30' :
                  'bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                } ${isToday ? 'ring-2 ring-[#0F9E75] shadow-lg' : ''}`}
              >
                {day && (
                  <>
                    <span>{day.getDate()}</span>
                    {status === 'full' && <CheckCircle2 size={10} className="absolute top-1 right-1 fill-current" />}
                    {status === 'partial' && <Circle size={8} className="absolute top-1 right-1 fill-current" />}
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
