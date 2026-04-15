'use client'

import { UtensilsCrossed, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import type { Meal, DailyMeals, InBodyRecord, UserProfile } from '@/lib/types'
import { motion } from 'framer-motion'
import { useLang } from '@/contexts/LangContext'

interface ShareableCardProps {
  dailyMeals: DailyMeals
  profile: UserProfile
  inbody: InBodyRecord
}

export default function ShareableCard({ dailyMeals, profile, inbody }: ShareableCardProps) {
  const { lang } = useLang()
  const now = new Date()
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
  
  const total = (['breakfast', 'lunch', 'dinner'] as const).reduce(
    (acc, mt) => ({
      cal: acc.cal + (dailyMeals[mt].calories ?? 0),
      p: acc.p + (dailyMeals[mt].protein ?? 0),
      c: acc.c + (dailyMeals[mt].carbs ?? 0),
      f: acc.f + (dailyMeals[mt].fat ?? 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  const compliance = Math.min(100, Math.round((total.cal / dailyMeals.targetCalories) * 100))

  return (
    <div 
      id="shareable-card-target"
      className="w-[400px] bg-slate-900 text-white p-8 rounded-[48px] overflow-hidden relative border-[12px] border-slate-800"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F9E75]/20 blur-[100px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pro/20 blur-[100px] -ml-32 -mb-32" />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F9E75] to-[#0BD68A] flex items-center justify-center shadow-lg shadow-[#0F9E75]/40">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">MacroDay <span className="text-[#0BD68A]">AI</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <Calendar size={10} />
            {dateStr}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
          {profile.goal.replace('_', ' ')}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="relative z-10 mb-10">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-6xl font-black leading-none">{total.cal}</span>
          <span className="text-slate-400 font-bold uppercase tracking-widest">kcal</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#0F9E75] to-[#0BD68A] rounded-full" 
            style={{ width: `${compliance}%` }} 
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold text-[#0BD68A] uppercase tracking-widest">Target Met: {compliance}%</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plan: {dailyMeals.targetCalories} kcal</span>
        </div>
      </div>

      {/* Macronutrients Grid */}
      <div className="grid grid-cols-3 gap-3 relative z-10 mb-10">
        <MacroItem label="Protein" value={total.p} target={dailyMeals.targetProtein} unit="g" color="#0BD68A" />
        <MacroItem label="Carbs" value={total.c} unit="g" color="#E09B20" />
        <MacroItem label="Fat" value={total.f} unit="g" color="#D85A30" />
      </div>

      {/* Meal Highlights */}
      <div className="space-y-3 relative z-10 mb-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Today's Menu Selection</p>
        <MealLine type={lang === 'zh' ? '早餐' : 'Breakfast'} name={dailyMeals.breakfast.name} />
        <MealLine type={lang === 'zh' ? '午餐' : 'Lunch'} name={dailyMeals.lunch.name} />
        <MealLine type={lang === 'zh' ? '晚餐' : 'Dinner'} name={dailyMeals.dinner.name} />
      </div>

      {/* Footer / Branding */}
      <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
            <TrendingUp size={12} className="text-[#0BD68A]" />
          </div>
          <span className="text-[10px] font-bold text-slate-400">Personalized AI Nutrition Coach</span>
        </div>
        <div className="flex items-center gap-1 opacity-50">
          <CheckCircle2 size={12} className="text-[#0BD68A]" />
          <span className="text-[9px] font-bold">Verified Result</span>
        </div>
      </div>
    </div>
  )
}

function MacroItem({ label, value, target, unit, color }: { label: string; value: number; target?: number; unit: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-black" style={{ color }}>{value}</span>
        <span className="text-[10px] font-bold text-slate-500">{unit}</span>
      </div>
      {target && <p className="text-[8px] font-bold text-slate-600 mt-1">Goal: {target}{unit}</p>}
    </div>
  )
}

function MealLine({ type, name }: { type: string; name: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500 min-w-[50px]">{type}</span>
      <span className="text-xs font-bold text-slate-200 truncate">{name}</span>
    </div>
  )
}
