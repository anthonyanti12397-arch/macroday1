'use client'

import { useState } from 'react'
import type { Meal } from '@/lib/types'
import { ChevronDown, ChevronUp, Clock, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import { useLang } from '@/contexts/LangContext'

interface MealCardProps {
  meal: Meal
  mealType: string
  imageLoading?: boolean
}

export default function MealCard({ meal, mealType, imageLoading = false }: MealCardProps) {
  const { t } = useLang()
  const m = t.meal
  const [expanded, setExpanded] = useState(false)
  const hasRecipe = !meal.isTakeout && (meal.ingredients.length > 0 || meal.steps.length > 0)
  const hasTakeoutInfo = meal.isTakeout && meal.whereToGet

  return (
    <div className="card-lg overflow-hidden">
      {/* Image with overlay */}
      <div className="relative w-full h-52 bg-slate-100">
        {imageLoading && !meal.imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#0F9E75] border-t-transparent animate-spin" />
            <span className="text-xs font-medium text-slate-400">{m.generatingImage}</span>
          </div>
        )}
        {meal.imageUrl && (
          <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" unoptimized />
        )}
        {!meal.imageUrl && !imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5F0] to-[#F0FDF9] flex items-center justify-center">
            <UtensilsCrossed size={32} className="text-[#0F9E75] opacity-30" />
          </div>
        )}

        {meal.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}

        {meal.imageUrl && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{mealType}</span>
              {meal.isTakeout ? (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  <ShoppingBag size={8} /> {m.takeout}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <UtensilsCrossed size={8} /> {m.homeCook}
                </span>
              )}
            </div>
            <p className="text-white font-bold text-base leading-tight drop-shadow-sm">{meal.name}</p>
          </div>
        )}

        {meal.cookingTime > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
            <Clock size={10} />
            {meal.cookingTime}m
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        {!meal.imageUrl && (
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{mealType}</span>
              {meal.isTakeout ? (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  <ShoppingBag size={8} /> {m.takeout}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <UtensilsCrossed size={8} /> {m.homeCook}
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 text-base leading-snug">{meal.name}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <MacroChip value={`${meal.protein}g`} label={m.protein} bg="bg-[#E8F5F0]" text="text-[#0F9E75]" />
          <MacroChip value={`${meal.carbs}g`} label={m.carbs} bg="bg-[#FDF5E6]" text="text-[#E09B20]" />
          <MacroChip value={`${meal.fat}g`} label={m.fat} bg="bg-[#FDF0EB]" text="text-[#D85A30]" />
          <MacroChip value={`${meal.calories}`} label="kcal" bg="bg-slate-100" text="text-slate-600" />
        </div>

        {hasTakeoutInfo && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
            <ShoppingBag size={12} className="shrink-0" />
            {meal.whereToGet}
          </div>
        )}

        {(hasRecipe || hasTakeoutInfo) && (
          <button onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] hover:text-[#0b8462] transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? m.hideRecipe : meal.isTakeout ? m.moreInfo : m.showRecipe}
          </button>
        )}

        {expanded && hasRecipe && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {meal.ingredients.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{m.ingredients}</p>
                <ul className="space-y-1">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="text-xs text-slate-600 flex gap-2 items-start">
                      <span className="text-[#0F9E75] mt-0.5 shrink-0">•</span>{ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meal.steps.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{m.steps}</p>
                <ol className="space-y-1.5">
                  {meal.steps.map((step, i) => (
                    <li key={i} className="text-xs text-slate-600 flex gap-2 items-start">
                      <span className="font-bold text-[#0F9E75] shrink-0 w-4">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MacroChip({ value, label, bg, text }: { value: string; label: string; bg: string; text: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${bg} ${text}`}>
      {value} <span className="font-medium opacity-70">{label}</span>
    </span>
  )
}
