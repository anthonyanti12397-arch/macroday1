'use client'

import { useState, useEffect } from 'react'
import { getMacroScore, getEquippedLoadout, getLatestInBody } from '@/lib/storage'
import Avatar from '@/components/Avatar'
import { useLang } from '@/contexts/LangContext'
import { useSession } from 'next-auth/react'
import ShareButton from '@/components/ShareButton'
import { ArrowLeft, Trophy, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import type { InBodyRecord } from '@/lib/types'

export default function AvatarShowcasePage() {
  const { lang, t } = useLang()
  const { data: session } = useSession()
  const [score, setScore] = useState(0)
  const [loadout, setLoadout] = useState<Record<string, string>>({})
  const [inbody, setInbody] = useState<InBodyRecord | null>(null)

  useEffect(() => {
    setScore(getMacroScore())
    setLoadout(getEquippedLoadout())
    setInbody(getLatestInBody())
  }, [])

  const userName = session?.user?.name || 'MacroDay User'
  const gloryLevel = Math.floor(score / 1000)

  const getGloryTitle = (level: number): string => {
    if (lang === 'zh') {
      if (level >= 5) return '🌟 傳奇健身者'
      if (level >= 4) return '⭐ 頂級健身者'
      if (level >= 3) return '💫 精英健身者'
      if (level >= 2) return '✨ 進階健身者'
      if (level >= 1) return '🔥 新興健身者'
      return '💪 初級健身者'
    } else {
      if (level >= 5) return '🌟 Legendary Athlete'
      if (level >= 4) return '⭐ Elite Champion'
      if (level >= 3) return '💫 Advanced Fitness Pro'
      if (level >= 2) return '✨ Rising Star'
      if (level >= 1) return '🔥 Fitness Enthusiast'
      return '💪 Beginner'
    }
  }

  const getGloryBenefit = (level: number): string => {
    if (lang === 'zh') {
      const benefits = [
        '開始你的健身之旅',
        '成功達成多次目標',
        '一致性訓練冠軍',
        '超越平凡的成就',
        '傳奇級的表現',
        '健身殿堂頂級'
      ]
      return benefits[Math.min(level, 5)]
    } else {
      const benefits = [
        'Starting your fitness journey',
        'Consistent goal achiever',
        'Training champion mindset',
        'Beyond ordinary achievements',
        'Legendary performance level',
        'Hall of fame status'
      ]
      return benefits[Math.min(level, 5)]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white py-6">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/avatar" className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-black tracking-tight">
            {lang === 'zh' ? '✨ 榮譽展示' : '✨ Glory Showcase'}
          </h1>
          <div className="w-10" />
        </div>

        {/* Showcase Card */}
        <div id="avatar-showcase-target" className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 p-8 space-y-8">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#0F9E75]/10 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-8">
            {/* Avatar Display */}
            <div className="flex justify-center pt-4">
              <Avatar
                loadout={loadout}
                size="lg"
                inbody={inbody}
                animated
                macroScore={score}
                showGloryAura={true}
              />
            </div>

            {/* User Info */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black tracking-tight">{userName}</h2>
              <p className="text-sm text-white/60">{getGloryBenefit(gloryLevel)}</p>

              {/* Glory Level Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30">
                <Star className="fill-[#FFD700]" size={16} />
                <span className="font-bold text-[#FFD700]">{getGloryTitle(gloryLevel)}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <div className="text-xl font-bold text-[#FFD700]">{score}</div>
                <div className="text-xs text-white/50 mt-1">
                  {lang === 'zh' ? '總分' : 'Total Score'}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <div className="text-xl font-bold text-[#0F9E75]">{gloryLevel}</div>
                <div className="text-xs text-white/50 mt-1">
                  {lang === 'zh' ? '榮譽等級' : 'Glory Level'}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <div className="text-xl font-bold text-purple-400">
                  {Math.round((score % 1000) / 10)}%
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {lang === 'zh' ? '升級進度' : 'Progress'}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                {lang === 'zh' ? '成就' : 'Achievements'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {gloryLevel >= 1 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <Zap size={14} className="text-amber-400" />
                    <span>{lang === 'zh' ? '完成第一個月' : 'First Month Complete'}</span>
                  </div>
                )}
                {gloryLevel >= 2 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <Trophy size={14} className="text-[#FFD700]" />
                    <span>{lang === 'zh' ? '連続100天' : '100-Day Streak'}</span>
                  </div>
                )}
                {gloryLevel >= 3 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <Star size={14} className="text-purple-400" />
                    <span>{lang === 'zh' ? '達成目標' : 'Goal Achieved'}</span>
                  </div>
                )}
                {gloryLevel >= 4 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <Zap size={14} className="text-[#0F9E75]" />
                    <span>{lang === 'zh' ? '健身傳奇' : 'Fitness Legend'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Button */}
            <div className="flex justify-center pt-4">
              <ShareButton
                targetId="avatar-showcase-target"
                fileName={`MacroDay-Showcase-${userName}`}
              />
            </div>
          </div>
        </div>

        {/* Next Level Info */}
        {gloryLevel < 5 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-sm text-white/70">
              {lang === 'zh' ? (
                <>
                  再得 <span className="font-bold text-[#FFD700]">{(gloryLevel + 1) * 1000 - score}</span> 分達到下一等級
                </>
              ) : (
                <>
                  <span className="font-bold text-[#FFD700]">{(gloryLevel + 1) * 1000 - score}</span> points to next level
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
