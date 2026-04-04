'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, Zap, UtensilsCrossed } from 'lucide-react'
import Logo from '@/components/Logo'
import SettingsSheet from '@/components/SettingsSheet'
import { useLang } from '@/contexts/LangContext'
import { getLatestInBody, getUserProfile } from '@/lib/storage'
import type { InBodyRecord, UserProfile } from '@/lib/types'
import MacroBar from '@/components/MacroBar'
import UpgradePrompt from '@/components/UpgradePrompt'

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
  const [inbody, setInbody] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    setInbody(getLatestInBody())
    setProfile(getUserProfile())
  }, [])

  const targets = inbody && profile ? calcTargets(inbody, profile.goal) : null

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-[#0F9E75] tracking-wide uppercase">{t.greeting(new Date().getHours())}</p>
          <Logo lang={lang} size="md" />
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#0F9E75] transition-colors"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Settings size={18} className="text-slate-500" />
        </button>
      </div>

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
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 8px 24px rgba(15,158,117,0.3)' }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">{inbody.date}</span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/20">
                  {t.settings.goalLabels[profile.goal]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <HeroStat label="Weight" value={`${inbody.weight}`} unit="kg" />
                <HeroStat label="Height" value={`${inbody.height}`} unit="cm" />
                <HeroStat label="Age" value={`${inbody.age}`} unit="yrs" />
              </div>
              {(inbody.bodyFat != null || inbody.skeletalMuscleMass != null) && (
                <div className="grid grid-cols-3 gap-3">
                  {inbody.bodyFat != null && <HeroStat label="Body Fat" value={`${inbody.bodyFat}`} unit="%" />}
                  {inbody.skeletalMuscleMass != null && <HeroStat label="Muscle" value={`${inbody.skeletalMuscleMass}`} unit="kg" />}
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

          {/* Daily targets */}
          <div className="card-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-800">{t.dashboard.targets}</p>
              <span className="text-xs font-bold text-[#0F9E75] bg-[#E8F5F0] px-2.5 py-1 rounded-full">
                {targets.calories} kcal
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              <MacroBar label={t.meal.protein} target={targets.protein} color="#0F9E75" />
              <MacroBar label={t.meal.carbs} target={targets.carbs} color="#E09B20" />
              <MacroBar label={t.meal.fat} target={targets.fat} color="#D85A30" />
            </div>
          </div>

          {/* CTA to meal plan */}
          <Link
            href="/meal-plan"
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)',
              boxShadow: '0 4px 16px rgba(15,158,117,0.3)',
            }}
          >
            <UtensilsCrossed size={18} />
            <span>{t.dashboard.todayMeals}</span>
            <span className="ml-auto text-white/70">›</span>
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
