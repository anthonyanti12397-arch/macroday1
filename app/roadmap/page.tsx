'use client'

import { useState, useEffect } from 'react'
import { getInBodyHistory, getComplianceHistory } from '@/lib/storage'
import { motion } from 'framer-motion'
import { Check, Lock, ChevronRight } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import Link from 'next/link'
import type { InBodyRecord } from '@/lib/types'

interface Milestone {
  id: string
  titleZh: string
  titleEn: string
  descZh: string
  descEn: string
  icon: string
  condition: () => boolean
  achieved: boolean
  achievedDate?: string
}

export default function RoadmapPage() {
  const { lang } = useLang()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const inbodyHistory = getInBodyHistory()
    const complianceHistory = getComplianceHistory(365)

    // Calculate milestones
    const firstRecordDate = inbodyHistory.length > 0 ? new Date(inbodyHistory[0].date).toLocaleDateString() : ''
    const allDates = Object.entries(complianceHistory).filter(([_, v]) => v !== 'none')
    const consecutiveDays = allDates.length > 0 ? allDates.length : 0

    const initialWeight = inbodyHistory[inbodyHistory.length - 1]?.weight
    const currentWeight = inbodyHistory[0]?.weight
    const weightChange = initialWeight && currentWeight ? initialWeight - currentWeight : 0

    const newMilestones: Milestone[] = [
      {
        id: 'joined',
        titleZh: '🚀 加入社群',
        titleEn: '🚀 Joined',
        descZh: '開始你的健身之旅',
        descEn: 'Started your fitness journey',
        icon: '🚀',
        condition: () => inbodyHistory.length > 0,
        achieved: inbodyHistory.length > 0,
        achievedDate: firstRecordDate
      },
      {
        id: 'first_record',
        titleZh: '📝 首條記錄',
        titleEn: '📝 First Record',
        descZh: '記錄第一次身體數據',
        descEn: 'Recorded your first body data',
        icon: '📝',
        condition: () => inbodyHistory.length > 0,
        achieved: inbodyHistory.length > 0,
        achievedDate: firstRecordDate
      },
      {
        id: 'week_streak',
        titleZh: '🔥 7 日連续',
        titleEn: '🔥 7-Day Streak',
        descZh: '連続完成 7 天目標',
        descEn: '7 consecutive days of compliance',
        icon: '🔥',
        condition: () => consecutiveDays >= 7,
        achieved: consecutiveDays >= 7
      },
      {
        id: 'month_streak',
        titleZh: '⭐ 30 日連续',
        titleEn: '⭐ 30-Day Streak',
        descZh: '連续 30 天達成目標',
        descEn: '30 consecutive days of compliance',
        icon: '⭐',
        condition: () => consecutiveDays >= 30,
        achieved: consecutiveDays >= 30
      },
      {
        id: 'weight_loss',
        titleZh: '📉 體重突破',
        titleEn: '📉 Weight Breakthrough',
        descZh: `體重下降 ${Math.abs(Math.floor(weightChange))} kg`,
        descEn: `Lost ${Math.abs(Math.floor(weightChange))} kg`,
        icon: '📉',
        condition: () => weightChange > 2,
        achieved: weightChange > 2
      },
    ]

    setMilestones(newMilestones)
    const achievedCount = newMilestones.filter(m => m.achieved).length
    setProgress(Math.round((achievedCount / newMilestones.length) * 100))
  }, [])

  return (
    <div className="py-6 space-y-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 px-2">
          {lang === 'zh' ? '🗺️ 你的成長藍圖' : '🗺️ Your Growth Roadmap'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 px-2">
          {lang === 'zh' ? '慶祝每一個里程碑，見證你的進步' : 'Celebrate every milestone and track your progress'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {lang === 'zh' ? '整體進度' : 'Overall Progress'}
          </span>
          <span className="text-sm font-bold text-[#0F9E75]">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#0F9E75] to-[#0BD68A] rounded-full"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="px-2 space-y-4">
        {milestones.map((milestone, idx) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`card-lg p-5 relative transition-all ${
              milestone.achieved
                ? 'border-[#0F9E75]/30 bg-white dark:bg-slate-900'
                : 'border-slate-200 dark:border-slate-700 opacity-75'
            }`}
          >
            {/* Timeline connector */}
            {idx < milestones.length - 1 && (
              <div className="absolute left-9 top-20 h-12 w-0.5 bg-gradient-to-b from-[#0F9E75]/30 to-transparent" />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
                  milestone.achieved
                    ? 'bg-[#0F9E75]/20'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  {milestone.achieved ? (
                    <Check className="w-5 h-5 text-[#0F9E75]" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm ${
                  milestone.achieved
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {lang === 'zh' ? milestone.titleZh : milestone.titleEn}
                </h3>
                <p className={`text-xs mt-1 ${
                  milestone.achieved
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {lang === 'zh' ? milestone.descZh : milestone.descEn}
                </p>
                {milestone.achievedDate && (
                  <p className="text-xs text-[#0F9E75] font-semibold mt-2">
                    ✓ {milestone.achievedDate}
                  </p>
                )}
              </div>

              {milestone.achieved && (
                <div className="shrink-0 pt-1">
                  <div className="w-6 h-6 rounded-full bg-[#0F9E75]/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#0F9E75]" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-2">
        <Link href="/avatar/showcase" className="block">
          <div className="card-lg p-5 flex items-center justify-between hover:shadow-lg transition-shadow bg-gradient-to-br from-[#0F9E75]/5 to-[#0BD68A]/5 border-[#0F9E75]/20">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {lang === 'zh' ? '查看你的成就展示' : 'View Your Achievement Showcase'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {lang === 'zh' ? '展示你的光環和成就' : 'Display your glory aura and achievements'}
              </p>
            </div>
            <ChevronRight className="text-[#0F9E75]" size={20} />
          </div>
        </Link>
      </div>
    </div>
  )
}
