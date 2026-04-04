'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLatestWeeklyPlan } from '@/lib/storage'
import type { WeeklyPlan } from '@/lib/types'
import ShoppingList from '@/components/ShoppingList'
import { ShoppingCart } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function ShoppingPage() {
  const { t } = useLang()
  const s = t.shopping
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)

  useEffect(() => { setPlan(getLatestWeeklyPlan()) }, [])

  return (
    <div className="py-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
            <ShoppingCart size={16} className="text-[#0F9E75]" />
          </div>
          <h1 className="page-header">{s.title}</h1>
        </div>
        {plan && (
          <p className="text-xs text-slate-400 pl-10">
            {s.fromPlan} {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {!plan && (
        <div className="card-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
            <ShoppingCart size={24} className="text-[#0F9E75]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 mb-1">{s.noList}</p>
            <p className="text-slate-500 text-sm">{s.noListDesc}</p>
          </div>
          <Link href="/meal-plan" className="btn-pro inline-flex px-8">{s.goMealPlan}</Link>
        </div>
      )}

      {plan && plan.shoppingList.length > 0 && <ShoppingList items={plan.shoppingList} />}

      {plan && plan.shoppingList.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-slate-400 text-sm">{s.noItems}</p>
        </div>
      )}
    </div>
  )
}
