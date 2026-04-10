'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, UtensilsCrossed, Heart, Clock } from 'lucide-react'
import Image from 'next/image'
import {
  getLatestInBody, getUserProfile,
  saveWeeklyPlan, getLatestWeeklyPlan,
  saveDailyMeals, getTodayDailyMeals, updateMealImage,
  incrementUsage, getTodayUsage,
  saveToStatsCache, getFromStatsCache,
  getFavorites,
} from '@/lib/storage'
import { generateStatsHash, getMemoryCache, setMemoryCache } from '@/lib/cache'
import type { InBodyRecord, UserProfile, WeeklyPlan, DailyMeals, Meal } from '@/lib/types'
import MealPlanGrid from '@/components/MealPlanGrid'
import MealCard from '@/components/MealCard'
import ConfettiCelebration from '@/components/ConfettiCelebration'
import UpgradePrompt from '@/components/UpgradePrompt'
import UsageCounter from '@/components/UsageCounter'
import { useLang } from '@/contexts/LangContext'
import { FREE_DAILY_LIMIT, BETA_MODE } from '@/lib/constants'
import { toast } from 'sonner'
import { MealCardSkeleton } from '@/components/Skeleton'
import ExportPDFButton from '@/components/ExportPDFButton'

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
  const [tab, setTab] = useState<'today' | 'week' | 'saved'>('today')

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
  const [showCelebration, setShowCelebration] = useState(false)
  const [swapping, setSwapping] = useState<Record<string, boolean>>({})

  const generateImages = useCallback(async (meals: DailyMeals) => {
    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const
    for (const type of mealTypes) {
      const meal = meals[type]
      if (meal.imageUrl) continue
      setImagesLoading((prev) => ({ ...prev, [type]: true }))
      const url = await fetchImage(meal.name, meal.imagePrompt)
      if (url) {
        updateMealImage(type, url) // This only updates Daily in storage...
        setDailyMeals((prev) => {
          if (!prev) return prev
          return { ...prev, [type]: { ...prev[type], imageUrl: url } }
        })
      }
      setImagesLoading((prev) => ({ ...prev, [type]: false }))
    }
  }, [])

  const generateWeekImages = useCallback(async (weekPlan: WeeklyPlan) => {
    // Generate images for each day of the week
    for (let dayIdx = 0; dayIdx < weekPlan.days.length; dayIdx++) {
      const day = weekPlan.days[dayIdx]
      const types = ['breakfast', 'lunch', 'dinner', 'snack'] as const
      for (const type of types) {
        const meal = day[type]
        if (!meal || meal.imageUrl) continue
        
        const loadingKey = `week-${dayIdx}-${type}`
        setImagesLoading((prev) => ({ ...prev, [loadingKey]: true }))
        
        const url = await fetchImage(meal.name, meal.imagePrompt)
        if (url) {
          setPlan((prev) => {
            if (!prev) return prev
            const newDays = [...prev.days]
            newDays[dayIdx] = { ...newDays[dayIdx], [type]: { ...newDays[dayIdx][type]!, imageUrl: url } }
            // Note: We should ideally update storage too, but plan is already saved
            return { ...prev, days: newDays }
          })
        }
        setImagesLoading((prev) => ({ ...prev, [loadingKey]: false }))
      }
    }
  }, [])

  async function swapMeal(mealType: 'breakfast' | 'lunch' | 'dinner') {
    const currentProfile = getUserProfile()
    const currentInbody = getLatestInBody()
    if (!currentInbody || !currentProfile || !dailyMeals) return
    setSwapping((prev) => ({ ...prev, [mealType]: true }))
    try {
      const res = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inbody: currentInbody,
          profile: currentProfile,
          mealType,
          currentMealName: dailyMeals[mealType].name,
          lang,
        }),
      })
      const newMeal = await res.json() as import('@/lib/types').Meal
      if ('error' in newMeal) throw new Error()
      setDailyMeals((prev) => prev ? { ...prev, [mealType]: newMeal } : prev)
      saveDailyMeals({ ...dailyMeals, [mealType]: newMeal })
      toast.success(lang === 'zh' ? `${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}已換！` : `${mealType} swapped!`)
      // Generate image for new meal
      fetchImage(newMeal.name, newMeal.imagePrompt).then((url) => {
        if (url) setDailyMeals((prev) => prev ? { ...prev, [mealType]: { ...prev[mealType], imageUrl: url } } : prev)
      })
    } catch {
      toast.error(lang === 'zh' ? '換餐失敗，請重試' : 'Swap failed, please try again')
    } finally {
      setSwapping((prev) => ({ ...prev, [mealType]: false }))
    }
  }

  useEffect(() => {
    setInbody(getLatestInBody())
    setProfile(getUserProfile())
    const cached = getTodayDailyMeals()
    if (cached) {
      setDailyMeals(cached)
      generateImages(cached)
    }
    const weekly = getLatestWeeklyPlan()
    if (weekly) {
      setPlan(weekly)
      generateWeekImages(weekly)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateToday(force = false) {
    const currentProfile = getUserProfile()
    const currentInbody = getLatestInBody()
    if (!currentInbody || !currentProfile) return

    if (!currentProfile.isPro && !BETA_MODE) {
      const usage = getTodayUsage()
      if (usage.count >= FREE_DAILY_LIMIT) {
        setShowUpgrade(true)
        return
      }
    }

    const cacheHash = generateStatsHash(currentInbody, currentProfile, lang)
    
    // 1. Check memory cache (fastest)
    const mem = getMemoryCache(cacheHash + '_daily')
    if (mem && !force) {
      setDailyMeals(mem)
      generateImages(mem)
      return
    }

    // 2. Check stats-hash cache (localStorage)
    if (!force) {
      const statsCached = getFromStatsCache<DailyMeals>(cacheHash + '_daily')
      if (statsCached) {
        setDailyMeals(statsCached)
        setMemoryCache(cacheHash + '_daily', statsCached)
        generateImages(statsCached)
        return
      }
    }

    if (!force) {
      const legacyCached = getTodayDailyMeals()
      if (legacyCached) {
        setDailyMeals(legacyCached)
        generateImages(legacyCached)
        return
      }
    }

    setLoadingToday(true)
    setErrorToday('')
    
    const promise = fetch('/api/generate-daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inbody: currentInbody, profile: currentProfile, lang }),
    }).then(async res => {
      const data = await res.json() as DailyMeals | { error: string }
      if ('error' in data) throw new Error(data.error)
      saveDailyMeals(data)
      saveToStatsCache(cacheHash + '_daily', data)
      setMemoryCache(cacheHash + '_daily', data)
      setDailyMeals(data)
      incrementUsage()
      setUsageKey((k) => k + 1)
      setShowCelebration(true)
      generateImages(data)
      return data
    })

    toast.promise(promise, {
      loading: lang === 'zh' ? '正在為您設計餐單...' : 'Designing your meals...',
      success: lang === 'zh' ? '餐單生成成功！' : 'Meals generated successfully!',
      error: (err) => err.message || (lang === 'zh' ? '生成失敗' : 'Generation failed')
    })

    try {
      await promise
    } catch (err) {
      setErrorToday(err instanceof Error ? err.message : 'Failed to generate meals')
    } finally {
      setLoadingToday(false)
    }
  }

  async function generateWeek() {
    const currentProfile = getUserProfile()
    if (!inbody || !currentProfile) return
    if (!currentProfile.isPro && !BETA_MODE) { setShowUpgrade(true); return }

    const cacheHash = generateStatsHash(inbody, currentProfile, lang)
    
    // Check cache first
    const mem = getMemoryCache(cacheHash + '_weekly')
    if (mem) { setPlan(mem); return }
    
    const statsCached = getFromStatsCache<WeeklyPlan>(cacheHash + '_weekly')
    if (statsCached) {
      setPlan(statsCached)
      setMemoryCache(cacheHash + '_weekly', statsCached)
      return
    }

    setLoadingWeek(true)
    setErrorWeek('')
    
    const promise = fetch('/api/generate-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inbody, profile: currentProfile, lang }),
    }).then(async res => {
      const data = await res.json() as WeeklyPlan | { error: string }
      if ('error' in data) throw new Error(data.error)
      saveToStatsCache(cacheHash + '_weekly', data)
      setMemoryCache(cacheHash + '_weekly', data)
      setPlan(data)
      generateWeekImages(data)
      return data
    })

    toast.promise(promise, {
      loading: lang === 'zh' ? '正在生成一週計畫...' : 'Generating weekly plan...',
      success: lang === 'zh' ? '一週計畫已就緒！' : 'Weekly plan is ready!',
      error: (err) => err.message || (lang === 'zh' ? '生成失敗' : 'Generation failed')
    })

    try {
      await promise
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
  const showGenerateBtn = tab !== 'saved'

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
        {showGenerateBtn && (
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
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {([
          { key: 'today', label: mp.tabToday },
          { key: 'week', label: mp.tabWeek },
          { key: 'saved', label: lang === 'zh' ? '已收藏' : 'Saved' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <>
          {errorToday && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">{errorToday}</div>
          )}

          {!profile?.isPro && !BETA_MODE && <UsageCounter key={usageKey} />}

          {/* Skeleton */}
          {loadingToday && (
            <div className="space-y-4">
              <MealCardSkeleton />
              <MealCardSkeleton />
              <MealCardSkeleton />
            </div>
          )}

          {!loadingToday && dailyMeals && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 tracking-tight">{t.dashboard.todayMeals}</h2>
                <div className="flex items-center gap-2">
                  <ExportPDFButton targetId="daily-meals-content" fileName={`MacroDay-Today-${(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()}`} />
                  <button
                    onClick={() => generateToday(true)}
                    className="text-xs font-semibold text-[#0F9E75] hover:text-[#0b8462] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} /> {t.btn.regenerate}
                  </button>
                </div>
              </div>

              <div id="daily-meals-content" className="space-y-4 -mx-1 px-1 py-1">
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
                    onSwap={() => swapMeal(type)}
                    swapping={swapping[type] ?? false}
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

          {!loadingWeek && plan && (
            <div className="space-y-4">
              <div className="flex justify-end pr-1">
                 <ExportPDFButton targetId="weekly-plan-content" fileName="MacroDay-Weekly-Plan" />
              </div>
               <div id="weekly-plan-content" className="p-1">
                <MealPlanGrid plan={plan} imagesLoading={imagesLoading} />
              </div>
            </div>
          )}

          {!loadingWeek && !plan && !errorWeek && (
            <div className="card p-8 text-center space-y-2">
              <p className="font-semibold text-slate-700">{mp.noData}</p>
              <p className="text-slate-400 text-sm">
                {profile && !profile.isPro && !BETA_MODE ? mp.proRequired : mp.noDataDesc}
              </p>
            </div>
          )}
        </>
      )}

      {/* SAVED TAB */}
      {tab === 'saved' && (
        <SavedMealsTab lang={lang} />
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

      <ConfettiCelebration
        trigger={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  )
}

function SavedMealsTab({ lang }: { lang: string }) {
  const [favorites, setFavorites] = useState<import('@/lib/types').Meal[]>([])

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  if (favorites.length === 0) {
    return (
      <div className="card-lg p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
          <Heart size={24} className="text-[#0F9E75]" />
        </div>
        <p className="font-bold text-slate-700">{lang === 'zh' ? '還沒有收藏' : 'No saved meals yet'}</p>
        <p className="text-sm text-slate-400">{lang === 'zh' ? '在餐單上點擊 ♡ 收藏喜歡的餐點' : 'Tap ♡ on any meal card to save it here'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
        {favorites.length} {lang === 'zh' ? '個收藏餐點' : 'saved meals'}
      </p>
      {favorites.map((meal, i) => (
        <div key={i} className="card-lg p-4 space-y-3">
          {meal.imageUrl && (
            <div className="relative h-32 rounded-xl overflow-hidden">
              <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" />
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-slate-800 text-sm">{meal.name}</p>
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={11} className="text-slate-400" />
              <span className="text-xs text-slate-400">{meal.cookingTime}min</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="tag-teal">{meal.calories} kcal</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F0] text-[#0F9E75]">P {meal.protein}g</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">C {meal.carbs}g</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">F {meal.fat}g</span>
          </div>
          {meal.ingredients.length > 0 && (
            <p className="text-xs text-slate-400 leading-relaxed">{meal.ingredients.slice(0, 4).join(' · ')}{meal.ingredients.length > 4 ? ' …' : ''}</p>
          )}
        </div>
      ))}
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
