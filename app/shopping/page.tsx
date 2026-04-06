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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
            <ShoppingCart size={16} className="text-[#0F9E75]" />
          </div>
          <h1 className="page-header">{s.title}</h1>
        </div>
      </div>
      <div className="card-lg p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
          <ShoppingCart size={24} className="text-[#0F9E75]" />
        </div>
        <div>
          <p className="font-bold text-slate-800 mb-1">{s.noList}</p>
          <p className="text-slate-500 text-sm">{s.noListDesc}</p>
        </div>
        <Link href="/meal-plan" className="btn-primary inline-flex px-8">{s.goMealPlan}</Link>
      </div>
    </div>
  )
}
