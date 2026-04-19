'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLatestWeeklyPlan, getTodayDailyMeals } from '@/lib/storage'
import type { WeeklyPlan, DailyMeals, ShoppingItem } from '@/lib/types'
import ShoppingList from '@/components/ShoppingList'
import { ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

function buildTodayShoppingItems(meals: DailyMeals): ShoppingItem[] {
  const seen = new Set<string>()
  const items: ShoppingItem[] = []
  const types = ['breakfast', 'lunch', 'dinner'] as const
  for (const type of types) {
    const meal = meals[type]
    if (!meal?.ingredients) continue
    for (const ing of meal.ingredients) {
      const key = ing.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ name: ing, amount: '', category: 'other' })
      }
    }
  }
  return items
}

export default function ShoppingPage() {
  const { lang, t } = useLang()
  const s = t.shopping
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [todayMeals, setTodayMeals] = useState<DailyMeals | null>(null)

  useEffect(() => {
    setPlan(getLatestWeeklyPlan())
    setTodayMeals(getTodayDailyMeals())
  }, [])

  if (plan) {
    return (
      <div className="py-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
              <ShoppingCart size={16} className="text-[#0F9E75]" />
            </div>
            <h1 className="page-header">{s.title}</h1>
          </div>
          <p className="text-xs text-slate-400 pl-10">
            {s.fromPlan} {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>
        {plan.shoppingList.length > 0 && <ShoppingList items={plan.shoppingList} />}
        {plan.shoppingList.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-slate-400 text-sm">{s.noItems}</p>
          </div>
        )}
      </div>
    )
  }

  if (todayMeals) {
    const todayItems = buildTodayShoppingItems(todayMeals)
    return (
      <div className="py-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
              <ShoppingCart size={16} className="text-[#0F9E75]" />
            </div>
            <h1 className="page-header">{s.title}</h1>
          </div>
          <p className="text-xs text-slate-400 pl-10">
            {lang === 'zh' ? '來自今日三餐食材' : "Based on today's meals"}
          </p>
        </div>
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #7F77DD 0%, #9B8FE8 100%)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">
              {lang === 'zh' ? '升級獲取 7 日購物清單' : 'Upgrade for 7-day shopping list'}
            </p>
            <p className="text-white/70 text-xs">
              {lang === 'zh' ? '一鍵生成整週食材清單' : 'Auto-generate full week ingredients'}
            </p>
          </div>
          <Link href="/meal-plan" className="shrink-0 text-[11px] font-bold bg-white text-[#7F77DD] px-3 py-1.5 rounded-xl">
            {lang === 'zh' ? '升級' : 'Upgrade'}
          </Link>
        </div>
        {todayItems.length > 0
          ? <ShoppingList items={todayItems} />
          : <div className="card p-8 text-center"><p className="text-slate-400 text-sm">{s.noItems}</p></div>
        }
      </div>
    )
  }

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 12px rgba(15,158,117,0.35)' }}>
          <ShoppingCart size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{s.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'zh' ? '自動生成週間採購清單' : 'Auto-generated weekly grocery list'}
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f1f1a 0%, #111827 60%, #0a1628 100%)', border: '1px solid rgba(15,158,117,0.15)', boxShadow: '0 0 40px rgba(15,158,117,0.06)' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }} />
        <div className="relative p-6 space-y-5">
          {/* Step progress */}
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: lang === 'zh' ? '身體數據' : 'Body Data', done: true },
              { n: 2, label: lang === 'zh' ? '餐單' : 'Meals', active: true },
              { n: 3, label: lang === 'zh' ? '購物' : 'Shopping', active: false },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${step.active ? 'text-white' : step.done ? 'text-white' : 'text-slate-600 bg-slate-800'}`}
                  style={step.active ? { background: 'linear-gradient(135deg, #0F9E75, #0BD68A)' } : step.done ? { background: '#1d4a3a' } : {}}>
                  {step.done ? '✓' : step.n}
                </div>
                <span className={`text-[10px] font-semibold truncate ${step.active ? 'text-[#0BD68A]' : step.done ? 'text-slate-500' : 'text-slate-600'}`}>{step.label}</span>
                {i < 2 && <div className="flex-1 h-px bg-slate-700 mx-1" />}
              </div>
            ))}
          </div>

          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(15,158,117,0.12)', border: '1px solid rgba(15,158,117,0.2)' }}>
              <ShoppingCart size={28} className="text-[#0F9E75]" />
            </div>
            <p className="font-bold text-white text-base mb-1">{s.noList}</p>
            <p className="text-slate-400 text-sm">{s.noListDesc}</p>
          </div>

          <Link href="/meal-plan" className="block w-full py-3.5 rounded-2xl text-white font-bold text-sm text-center transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 14px rgba(15,158,117,0.35)' }}>
            {lang === 'zh' ? '前往生成餐單 →' : 'Go to Meal Plan →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
