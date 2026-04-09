'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, Zap, UtensilsCrossed, ShieldAlert, CheckCircle, Sparkles, ChevronRight, TrendingUp } from 'lucide-react'
import Logo from '@/components/Logo'
import SettingsSheet from '@/components/SettingsSheet'
import { useLang } from '@/contexts/LangContext'
import { getLatestInBody, getUserProfile, getTodayDailyMeals, getGuestSession, getFromStatsCache } from '@/lib/storage'
import { generateStatsHash, setMemoryCache } from '@/lib/cache'
import type { InBodyRecord, UserProfile, DailyMeals } from '@/lib/types'
import MacroBar from '@/components/MacroBar'
import UpgradePrompt from '@/components/UpgradePrompt'
import { useSession } from 'next-auth/react'
import { BETA_MODE } from '@/lib/constants'
import DonationBox from '@/components/DonationBox'
import ShareButton from '@/components/ShareButton'
import ComplianceCalendar from '@/components/ComplianceCalendar'
import ProgressRing from '@/components/ProgressRing'
import StreakBadge from '@/components/StreakBadge'
import PushPermissionBanner from '@/components/PushPermissionBanner'
import NutritionTrend from '@/components/NutritionTrend'
import WeeklyInsights from '@/components/WeeklyInsights'
import WeightSparkline from '@/components/WeightSparkline'

function estimateBMR(r: InBodyRecord): number {
  if (r.bmr) return r.bmr
  const base = 10 * r.weight + 6.25 * r.height - 5 * r.age
  return Math.round(r.gender === 'male' ? base + 5 : base - 161)
}

function calcTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = estimateBMR(inbody)
  const muscle = inbody.skeletalMuscleMass
  let targetCalories: number, targetProtein: number
  switch (goal) {
    case 'fat_loss':
      targetCalories = Math.round(bmr * 0.85)
      targetProtein = muscle ? Math.round(muscle * 2.2) : Math.round(inbody.weight * 1.8)
      break
    case 'muscle_gain':
      targetCalories = Math.round(bmr * 1.15)
      targetProtein = muscle ? Math.round(muscle * 2.5) : Math.round(inbody.weight * 2.0)
      break
    default:
      targetCalories = Math.round(bmr * 1.0)
      targetProtein = muscle ? Math.round(muscle * 2.0) : Math.round(inbody.weight * 1.6)
  }
  const targetFat = Math.round((targetCalories * 0.25) / 9)
  const targetCarbs = Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4)
  return { protein: targetProtein, carbs: Math.max(0, targetCarbs), fat: targetFat, calories: targetCalories }
}

export default function DashboardPage() {
  const { lang, t } = useLang()
  const { status } = useSession()
  const [inbody, setInbody] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [todayMeals, setTodayMeals] = useState<DailyMeals | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [guestWarningDismissed, setGuestWarningDismissed] = useState(false)

  useEffect(() => {
    const currentInbody = getLatestInBody()
    const currentProfile = getUserProfile()
    setInbody(currentInbody)
    setProfile(currentProfile)
    setIsGuest(!!getGuestSession())

    if (currentInbody && currentProfile) {
      const cacheHash = generateStatsHash(currentInbody, currentProfile, lang)
      const statsCached = getFromStatsCache<DailyMeals>(cacheHash + '_daily')
      if (statsCached) {
        setTodayMeals(statsCached)
        setMemoryCache(cacheHash + '_daily', statsCached)
        return
      }
    }
    
    setTodayMeals(getTodayDailyMeals())
  }, [lang])

  const targets = inbody && profile ? calcTargets(inbody, profile.goal) : null

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#0F9E75] tracking-wide uppercase">{t.greeting(new Date().getHours())}</p>
          <Logo lang={lang} size="md" />
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge />
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#0F9E75] transition-colors"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Settings size={18} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Beta banner */}
      {BETA_MODE && (
        <div className="flex items-center gap-2.5 bg-[#7F77DD]/10 border border-[#7F77DD]/20 rounded-2xl px-4 py-2.5">
          <Zap size={14} className="text-[#7F77DD] shrink-0" />
          <p className="text-xs font-semibold text-[#7F77DD]">
            {lang === 'zh' ? '公測版 — 所有功能限時免費開放' : 'Beta — All features unlocked for free'}
          </p>
        </div>
      )}

      {/* Push permission banner */}
      <PushPermissionBanner />

      {/* Guest data warning */}
      {isGuest && status !== 'authenticated' && !guestWarningDismissed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700 mb-0.5">
              {lang === 'zh' ? '訪客模式：數據僅存於此裝置' : 'Guest mode: data stored on this device only'}
            </p>
            <p className="text-[11px] text-amber-600">
              {lang === 'zh' ? '登入帳號以在所有裝置同步並保護你的數據' : 'Sign in to sync and protect your data across devices'}
            </p>
          </div>
          <button onClick={() => setGuestWarningDismissed(true)} className="text-amber-400 hover:text-amber-600 text-sm shrink-0 font-bold">×</button>
        </div>
      )}

      {/* No InBody data */}
      {!inbody && (
        <div className="card-lg p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
            <Zap size={28} className="text-[#0F9E75]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg mb-1">{t.dashboard.noDataTitle}</p>
            <p className="text-slate-500 text-sm">{t.dashboard.noDataDesc}</p>
          </div>
          <Link href="/inbody" className="btn-primary inline-flex px-8">
            {t.btn.getStarted}
          </Link>
        </div>
      )}

      {inbody && profile && targets && (
        <>
          {/* Hero stats card */}
          <div id="stats-card-capture" className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 8px 24px rgba(15,158,117,0.3)' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.1em] mb-1">{inbody.date}</span>
                  <Logo lang={lang} size="sm" variant="white" />
                </div>
                <div className="flex items-center gap-2">
                   <ShareButton targetId="stats-card-capture" fileName={`MacroDay-Progress-${inbody.date}`} />
                   <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/20 backdrop-blur-md">
                     {t.settings.goalLabels[profile.goal]}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <HeroStat label={lang === 'zh' ? '體重' : 'Weight'} value={`${inbody.weight}`} unit="kg" />
                <HeroStat label={lang === 'zh' ? '身高' : 'Height'} value={`${inbody.height}`} unit="cm" />
                <HeroStat label={lang === 'zh' ? '年齡' : 'Age'} value={`${inbody.age}`} unit="" />
              </div>
              {(inbody.bodyFat != null || inbody.skeletalMuscleMass != null) && (
                <div className="grid grid-cols-3 gap-4">
                  {inbody.bodyFat != null && <HeroStat label={lang === 'zh' ? '體脂' : 'Body Fat'} value={`${inbody.bodyFat}`} unit="%" />}
                  {inbody.skeletalMuscleMass != null && <HeroStat label={lang === 'zh' ? '肌肉' : 'Muscle'} value={`${inbody.skeletalMuscleMass}`} unit="kg" />}
                  <HeroStat label={inbody.bmr != null ? 'BMR' : 'BMR est.'} value={`${estimateBMR(inbody)}`} unit="kcal" />
                </div>
              )}
            </div>

            {/* Cooking style strip */}
            <div className="bg-black/10 px-5 py-2.5 flex items-center gap-2">
              <span className="text-white/60 text-xs">{t.dashboard.styleLabel}:</span>
              <span className="text-white text-xs font-semibold">
                {t.cookingStyle[profile.cookingStyle]}
              </span>
              {profile.proteinPreferences.length > 0 && (
                <span className="text-white/50 text-xs">· {profile.proteinPreferences.slice(0, 3).join(', ')}</span>
              )}
              <Link href="/inbody" className="ml-auto text-white/60 text-[10px] font-semibold hover:text-white">Edit ›</Link>
            </div>
          </div>

          {/* Support Developer */}
          <DonationBox />

          {/* Daily targets */}
          <div className="card-lg p-6 bg-white/70 backdrop-blur-xl border-white/40 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-slate-800 tracking-tight">{t.dashboard.targets}</p>
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-[#0F9E75] leading-none">
                  {targets.calories}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">kcal / day</span>
              </div>
            </div>
            <div className="space-y-4">
              <MacroBar label={t.meal.protein} target={targets.protein} color="#0F9E75" />
              <MacroBar label={t.meal.carbs} target={targets.carbs} color="#E09B20" />
              <MacroBar label={t.meal.fat} target={targets.fat} color="#D85A30" />
            </div>
          </div>

          {/* Compliance Tracker */}
          <ComplianceCalendar />

          {/* 7-day nutrition trend */}
          <NutritionTrend />

          {/* Weekly insights */}
          <WeeklyInsights />

          {/* Weight trend sparkline */}
          <WeightSparkline />

          {/* Today's nutrition progress rings */}
          {todayMeals && targets && (() => {
            const total = (['breakfast', 'lunch', 'dinner'] as const).reduce(
              (acc, mt) => ({
                cal: acc.cal + (todayMeals[mt].calories ?? 0),
                p: acc.p + (todayMeals[mt].protein ?? 0),
                c: acc.c + (todayMeals[mt].carbs ?? 0),
                f: acc.f + (todayMeals[mt].fat ?? 0),
              }),
              { cal: 0, p: 0, c: 0, f: 0 }
            )
            return (
              <div className="card-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-[#0F9E75]" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {lang === 'zh' ? '今日達成率' : "Today's Progress"}
                  </p>
                </div>
                <div className="flex justify-around">
                  <ProgressRing value={total.cal} target={targets.calories} label={lang === 'zh' ? '卡路里' : 'Calories'} unit="kcal" color="#0F9E75" />
                  <ProgressRing value={total.p} target={targets.protein} label={lang === 'zh' ? '蛋白質' : 'Protein'} unit="g" color="#0BD68A" />
                  <ProgressRing value={total.c} target={targets.carbs} label={lang === 'zh' ? '碳水' : 'Carbs'} unit="g" color="#E09B20" />
                  <ProgressRing value={total.f} target={targets.fat} label={lang === 'zh' ? '脂肪' : 'Fat'} unit="g" color="#D85A30" />
                </div>
              </div>
            )
          })()}

          {/* Today's meals status card */}
          <Link href="/meal-plan" className="block">
            {todayMeals ? (
              <div className="card-lg p-4 flex items-center gap-4 hover:border-[#0F9E75] transition-colors">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F5F0] flex items-center justify-center shrink-0">
                  <CheckCircle size={20} className="text-[#0F9E75]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0F9E75] uppercase tracking-wide mb-0.5">
                    {lang === 'zh' ? '今日三餐 ✓' : "Today's Meals ✓"}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                      <span key={type} className="text-xs font-semibold text-slate-600 truncate">
                        {todayMeals[type].name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-slate-300 text-lg shrink-0">›</span>
              </div>
            ) : (
              <div
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.3)' }}
              >
                <UtensilsCrossed size={18} />
                <div>
                  <p>{lang === 'zh' ? '今天還未生成三餐' : "Today's meals not yet generated"}</p>
                  <p className="text-white/60 text-xs font-medium mt-0.5">{lang === 'zh' ? '點擊立即生成 →' : 'Tap to generate →'}</p>
                </div>
              </div>
            )}
          </Link>
        </>
      )}

      {/* Settings sheet */}
      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          onLogout={() => {
            setShowSettings(false)
            window.location.reload()
          }}
        />
      )}

      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => {
            setShowUpgrade(false)
            setProfile(getUserProfile())
          }}
        />
      )}
    </div>
  )
}

function HeroStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-center">
      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-white font-bold text-lg leading-none">{value}<span className="text-white/60 text-xs font-medium ml-0.5">{unit}</span></p>
    </div>
  )
}
