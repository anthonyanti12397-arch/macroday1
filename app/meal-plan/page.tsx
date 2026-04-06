'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, UtensilsCrossed } from 'lucide-react'
import {
  getLatestInBody, getUserProfile,
  saveWeeklyPlan, getLatestWeeklyPlan,
  saveDailyMeals, getTodayDailyMeals, updateMealImage,
  incrementUsage, getTodayUsage,
} from '@/lib/storage'
import type { InBodyRecord, UserProfile, WeeklyPlan, DailyMeals, Meal } from '@/lib/types'
import MealPlanGrid from '@/components/MealPlanGrid'
import MealCard from '@/components/MealCard'
import UpgradePrompt from '@/components/UpgradePrompt'
import UsageCounter from '@/components/UsageCounter'
import { useLang } from '@/contexts/LangContext'
import { FREE_DAILY_LIMIT } from '@/lib/constants'

async function fetchImage(mealName: string, imagePrompt?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealName, imagePrompt }),
    })
    const data = await res.json() as { url?: string; error?: string }
    return data.url ?? null
  } catch {
    return null
  }
}

export default function MealPlanPage() {
  const { lang, t } = useLang()
  const mp = t.mealPlan
  const [tab, setTab] = useState<'today' | 'week'>('today')

  const [inbody, setInbody] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Today tab state
  const [dailyMeals, setDailyMeals] = useState<DailyMeals | null>(null)
  const [loadingToday, setLoadingToday] = useState(false)
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({})
  const [errorToday, setErrorToday] = useState('')
  const [usageKey, setUsageKey] = useState(0)

  // Week tab state
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [errorWeek, setErrorWeek] = useState('')

  // Shared
  const [showUpgrade, setShowUpgrade] = useState(false)

  const generateImages = useCallback(async (meals: DailyMeals) => {
    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const
    for (const type of mealTypes) {
      const meal = meals[type]
      if (meal.imageUrl) continue
      setImagesLoading((prev) => ({ ...prev, [type]: true }))
      const url = await fetchImage(meal.name, meal.imagePrompt)
      if (url) {
        updateMealImage(type, url)
        setDailyMeals((prev) => {
          if (!prev) return prev
          return { ...prev, [type]: { ...prev[type], imageUrl: url } }
        })
      }
      setImagesLoading((prev) => ({ ...prev, [type]: false }))
    }
  }, [])

  useEffect(() => {
    setInbody(getLatestInBody())
    setProfile(getUserProfile())
    const cached = getTodayDailyMeals()
    if (cached) {
      setDailyMeals(cached)
      generateImages(cached)
    }
    setPlan(getLatestWeeklyPlan())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateToday(force = false) {
    const currentProfile = getUserProfile()
    const currentInbody = getLatestInBody()
    if (!currentInbody || !currentProfile) return

    if (!currentProfile.isPro) {
      const usage = getTodayUsage()
      if (usage.count >= FREE_DAILY_LIMIT) {
        setShowUpgrade(true)
        return
      }
    }

    if (!force) {
      const cached = getTodayDailyMeals()
      if (cached) {
        setDailyMeals(cached)
        generateImages(cached)
        return
      }
    }

    setLoadingToday(true)
    setErrorToday('')
    try {
      const res = await fetch('/api/generate-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inbody: currentInbody, profile: currentProfile, lang }),
      })
      const data = await res.json() as DailyMeals | { error: string }
      if ('error' in data) throw new Error(data.error)
      saveDailyMeals(data)
      setDailyMeals(data)
      incrementUsage()
      setUsageKey((k) => k + 1)
      generateImages(data)
    } catch (err) {
      setErrorToday(err instanceof Error ? err.message : 'Failed to generate meals')
    } finally {
      setLoadingToday(false)
    }
  }

  async function generateWeek() {
    const currentProfile = getUserProfile()
    if (!inbody || !currentProfile) return
    if (!currentProfile.isPro) { setShowUpgrade(true); return }

    setLoadingWeek(true)
    setErrorWeek('')
    try {
      const res = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inbody, profile: currentProfile, lang }),
      })
      const data = await res.json() as WeeklyPlan | { error: string }
      if ('error' in data) throw new Error(data.error)
      saveWeeklyPlan(data)
      setPlan(data)
    } catch (err) {
      setErrorWeek(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setLoadingWeek(false)
    }
  }

  // No body data state
  if (!inbody) {
    return (
      <div className="py-6 space-y-4">
        <h1 className="page-header">{mp.title}</h1>
        <div className="card-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
            <UtensilsCrossed size={24} className="text-[#0F9E75]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 mb-1">{mp.noBodyData}</p>
            <p className="text-slate-500 text-sm">{mp.noBodyDataDesc}</p>
          </div>
          <Link href="/inbody" className="btn-primary inline-flex px-8">{mp.addData}</Link>
        </div>
      </div>
    )
  }

  const loading = tab === 'today' ? loadingToday : loadingWeek
  const handleGenerate = tab === 'today' ? () => generateToday(!!dailyMeals) : generateWeek

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-header mb-2">{mp.title}</h1>
          {profile && (
            <div className="flex flex-wrap gap-1.5">
              <span className="tag-teal">{t.settings.goalLabels[profile.goal]}</span>
              {profile.dietaryRestrictions.map((r) => (
                <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{r}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary shrink-0 px-4 py-2.5 text-sm gap-1.5"
          style={{ borderRadius: '14px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {tab === 'today'
            ? (dailyMeals ? t.btn.regenerate : t.btn.generate)
            : (plan ? t.btn.regenerate : t.btn.generate)
          }
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {(['today', 'week'] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              tab === t_
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t_ === 'today' ? mp.tabToday : mp.tabWeek}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <>
          {errorToday && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">{errorToday}</div>
          )}

          {!profile?.isPro && <UsageCounter key={usageKey} />}

          {/* Skeleton */}
          {loadingToday && (
            <div className="space-y-4">
              {['breakfast', 'lunch', 'dinner'].map((label) => (
                <div key={label} className="card-lg overflow-hidden">
                  <div className="h-52 bg-slate-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-16 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-5 w-48 bg-slate-100 rounded-full animate-pulse" />
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-6 w-14 bg-slate-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingToday && dailyMeals && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 tracking-tight">{t.dashboard.todayMeals}</h2>
                <button
                  onClick={() => generateToday(true)}
                  className="text-xs font-semibold text-[#0F9E75] hover:text-[#0b8462] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} /> {t.btn.regenerate}
                </button>
              </div>

              {(['breakfast', 'lunch', 'dinner'] as const).map((type) => {
                const meal: Meal = { ...dailyMeals[type] }
                const mealTypeLabel = t.meal[type]
                return (
                  <MealCard
                    key={type}
                    meal={meal}
                    mealType={mealTypeLabel}
                    imageLoading={imagesLoading[type] ?? false}
                    mealKey={type}
                  />
                )
              })}

              {/* Daily total */}
              {(() => {
                const total = (['breakfast', 'lunch', 'dinner'] as const).reduce(
                  (acc, mt) => ({
                    cal: acc.cal + (dailyMeals[mt].calories ?? 0),
                    p: acc.p + (dailyMeals[mt].protein ?? 0),
                    c: acc.c + (dailyMeals[mt].carbs ?? 0),
                    f: acc.f + (dailyMeals[mt].fat ?? 0),
                  }),
                  { cal: 0, p: 0, c: 0, f: 0 }
                )
                return (
                  <div className="card p-4 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.dashboard.dayTotal}</span>
                    <div className="flex gap-3 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">{total.cal} kcal</span>
                      <span className="text-xs font-bold text-[#0F9E75]">P: {total.p}g</span>
                      <span className="text-xs font-bold text-[#E09B20]">C: {total.c}g</span>
                      <span className="text-xs font-bold text-[#D85A30]">F: {total.f}g</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {!loadingToday && !dailyMeals && !errorToday && (
            <TodayEmptyState
              profile={profile}
              inbody={inbody}
              lang={lang}
              onGenerate={() => generateToday(false)}
            />
          )}
        </>
      )}

      {/* WEEK TAB */}
      {tab === 'week' && (
        <>
          {errorWeek && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">{errorWeek}</div>
          )}

          {/* Skeleton */}
          {loadingWeek && (
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-lg p-4 space-y-3">
                  <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingWeek && plan && <MealPlanGrid plan={plan} />}

          {!loadingWeek && !plan && !errorWeek && (
            <div className="card p-8 text-center space-y-2">
              <p className="font-semibold text-slate-700">{mp.noData}</p>
              <p className="text-slate-400 text-sm">
                {profile && !profile.isPro ? mp.proRequired : mp.noDataDesc}
              </p>
            </div>
          )}
        </>
      )}

      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => {
            setShowUpgrade(false)
            setProfile(getUserProfile())
            if (tab === 'week') generateWeek()
          }}
        />
      )}
    </div>
  )
}

function calcDailyTargets(inbody: InBodyRecord, goal: UserProfile['goal']) {
  const bmr = inbody.bmr ?? Math.round(
    (10 * inbody.weight + 6.25 * inbody.height - 5 * inbody.age) + (inbody.gender === 'male' ? 5 : -161)
  )
  const muscle = inbody.skeletalMuscleMass
  let cal: number, protein: number
  switch (goal) {
    case 'fat_loss':    cal = Math.round(bmr * 0.85); protein = muscle ? Math.round(muscle * 2.2) : Math.round(inbody.weight * 1.8); break
    case 'muscle_gain': cal = Math.round(bmr * 1.15); protein = muscle ? Math.round(muscle * 2.5) : Math.round(inbody.weight * 2.0); break
    default:            cal = Math.round(bmr * 1.0);  protein = muscle ? Math.round(muscle * 2.0) : Math.round(inbody.weight * 1.6)
  }
  return { cal, protein }
}

function TodayEmptyState({ profile, inbody, lang, onGenerate }: {
  profile: UserProfile | null
  inbody: InBodyRecord | null
  lang: string
  onGenerate: () => void
}) {
  const now = new Date()
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weekdaysZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const dayLabel = lang === 'zh' ? weekdaysZh[now.getDay()] : weekdays[now.getDay()]
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}`
  const targets = (inbody && profile) ? calcDailyTargets(inbody, profile.goal) : null

  return (
    <div className="card-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#0F9E75] uppercase tracking-widest mb-0.5">{dayLabel}</p>
          <p className="text-2xl font-bold text-slate-900">{dateStr}</p>
        </div>
        <div className="w-14 h-14 rounded-3xl bg-[#E8F5F0] flex items-center justify-center">
          <UtensilsCrossed size={24} className="text-[#0F9E75]" />
        </div>
      </div>
      {targets && (
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">{targets.cal}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">kcal</p>
          </div>
          <div className="flex-1 bg-[#E8F5F0] rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-[#0F9E75]">{targets.protein}g</p>
            <p className="text-[10px] font-semibold text-[#0F9E75]/60 uppercase tracking-wide">{lang === 'zh' ? '蛋白質' : 'Protein'}</p>
          </div>
        </div>
      )}
      <button onClick={onGenerate} className="w-full btn-primary py-4 text-base gap-2">
        <UtensilsCrossed size={18} />
        {lang === 'zh' ? '生成今日三餐' : "Generate Today's Meals"}
      </button>
      <p className="text-center text-xs text-slate-400">
        {lang === 'zh' ? 'AI 根據你的身體數據個人化生成' : 'AI personalised based on your body data'}
      </p>
    </div>
  )
}
