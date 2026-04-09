'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
const CookMode = lazy(() => import('./CookMode'))
import type { Meal } from '@/lib/types'
import { ChevronDown, ChevronUp, Clock, Heart, CheckCircle2, ShoppingBag, UtensilsCrossed, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useLang } from '@/contexts/LangContext'
import { toggleMealEaten, getEatenMeals, toggleFavorite, isFavorite } from '@/lib/storage'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface MealCardProps {
  meal: Meal
  mealType: string
  imageLoading?: boolean
  mealKey?: string
  onSwap?: () => void
  swapping?: boolean
}

export default function MealCard({ meal, mealType, imageLoading = false, mealKey, onSwap, swapping = false }: MealCardProps) {
  const { lang, t } = useLang()
  const m = t.meal
  const [expanded, setExpanded] = useState(false)
  const [eaten, setEaten] = useState(false)
  const [fav, setFav] = useState(false)
  const [cookMode, setCookMode] = useState(false)

  useEffect(() => {
    if (mealKey) setEaten(getEatenMeals().includes(mealKey))
    setFav(isFavorite(meal.name))
  }, [meal.name, mealKey])

  function handleEaten(e: React.MouseEvent) {
    e.stopPropagation()
    if (!mealKey) return
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(10);
    const updated = toggleMealEaten(mealKey)
    setEaten(updated.includes(mealKey))
  }

  function handleFav(e: React.MouseEvent) {
    e.stopPropagation()
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
    const added = toggleFavorite(meal)
    setFav(added)
    if (added) {
      toast.success(lang === 'zh' ? '已加入收藏！' : 'Added to favorites!')
    }
  }
  const hasRecipe = !meal.isTakeout && (meal.ingredients.length > 0 || meal.steps.length > 0)
  const hasTakeoutInfo = meal.isTakeout && meal.whereToGet

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-lg overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      {/* Image with overlay */}
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
        {imageLoading && !meal.imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#0F9E75] border-t-transparent animate-spin" />
            <span className="text-xs font-medium text-slate-400">{m.generatingImage}</span>
          </div>
        )}
        {meal.imageUrl && (
          <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover transition-transform duration-700 hover:scale-105" unoptimized />
        )}
        {!meal.imageUrl && !imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5F0] to-[#F0FDF9] flex items-center justify-center">
            <UtensilsCrossed size={32} className="text-[#0F9E75] opacity-20" />
          </div>
        )}

        {/* Dynamic Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${meal.imageUrl ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent' : 'bg-transparent'}`} />

        <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${meal.imageUrl ? 'text-white/80' : 'text-slate-400'}`}>{mealType}</span>
              {meal.isTakeout ? (
                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950 shadow-sm shadow-amber-400/20">
                  <ShoppingBag size={8} /> {m.takeout}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#0F9E75] text-white shadow-sm shadow-[#0F9E75]/20">
                  <UtensilsCrossed size={8} /> {m.homeCook}
                </span>
              )}
            </div>
            <p className={`font-black text-lg leading-tight tracking-tight ${meal.imageUrl ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>{meal.name}</p>
        </div>

        {meal.cookingTime > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-white/10 shadow-sm">
            <Clock size={11} />
            {meal.cookingTime} min
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <MacroChip value={`${meal.protein}g`} label="PRO" bg="bg-[#E8F5F0]" text="text-[#0F9E75]" />
          <MacroChip value={`${meal.carbs}g`} label="CARB" bg="bg-[#FFF8E6]" text="text-[#E09B20]" />
          <MacroChip value={`${meal.fat}g`} label="FAT" bg="bg-[#FFF0EB]" text="text-[#D85A30]" />
          <MacroChip value={`${meal.calories}`} label="KCAL" bg="bg-slate-50" text="text-slate-500" />
        </div>

        {/* Eaten + Favorite + Swap actions */}
        <div className="flex items-center gap-2.5">
          {onSwap && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onSwap() }}
              disabled={swapping}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:border-[#0F9E75] hover:text-[#0F9E75] transition-all disabled:opacity-50"
              title={lang === 'zh' ? '換一個' : 'Swap meal'}
            >
              <RefreshCw size={16} className={swapping ? 'animate-spin' : ''} />
            </motion.button>
          )}
          {mealKey && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleEaten}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-2xl border transition-all ${
                eaten
                  ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-lg shadow-[#0F9E75]/20'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-[#0F9E75]/40 hover:text-[#0F9E75]'
              }`}
            >
              <CheckCircle2 size={15} className={eaten ? 'text-white' : ''} />
              {lang === 'zh' ? (eaten ? '已食用' : '標記已吃') : (eaten ? 'Eaten' : 'Mark Eaten')}
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFav}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
              fav
                ? 'bg-red-50 text-red-500 border-red-200 shadow-sm'
                : 'bg-white text-slate-300 border-slate-200 hover:text-red-400'
            }`}
          >
            <Heart size={18} className={fav ? 'fill-red-500 text-red-500' : ''} />
          </motion.button>
          {!meal.isTakeout && meal.steps.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); setCookMode(true) }}
              className="w-12 h-12 flex items-center justify-center rounded-2xl border border-[#0F9E75]/30 bg-[#E8F5F0] text-[#0F9E75] hover:bg-[#0F9E75] hover:text-white transition-all"
              title={lang === 'zh' ? '開始烹飪' : 'Start cooking'}
            >
              <UtensilsCrossed size={16} />
            </motion.button>
          )}
        </div>

        {hasTakeoutInfo && (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-amber-100">
            <ShoppingBag size={14} className="shrink-0" />
            <span className="truncate">{meal.whereToGet}</span>
          </div>
        )}

        {(hasRecipe || hasTakeoutInfo) && (
          <button 
            onClick={() => {
               if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(2);
               setExpanded((v) => !v);
            }}
            className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-400 hover:text-[#0F9E75] transition-colors"
          >
            <span className="uppercase tracking-widest">{expanded ? m.hideRecipe : meal.isTakeout ? m.moreInfo : m.showRecipe}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}

        <AnimatePresence>
          {expanded && hasRecipe && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pt-2"
            >
              <div className="h-px bg-slate-100" />
              {meal.ingredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2.5">{m.ingredients}</p>
                  <ul className="grid grid-cols-1 gap-2">
                    {meal.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs font-bold text-slate-600 flex gap-2.5 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0F9E75]/30" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {meal.steps.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2.5">{m.steps}</p>
                  <ol className="space-y-3">
                    {meal.steps.map((step, i) => (
                      <li key={i} className="text-xs font-medium text-slate-600 flex gap-3 items-start">
                        <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#0F9E75]/10 text-[#0F9E75] font-black text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cookMode && (
        <Suspense fallback={null}>
          <CookMode meal={meal} onClose={() => setCookMode(false)} />
        </Suspense>
      )}
    </motion.div>
  )
}

function MacroChip({ value, label, bg, text }: { value: string; label: string; bg: string; text: string }) {
  return (
    <div className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-xl ${bg} ${text} border border-black/5`}>
      <span className="text-xs font-black leading-none mb-0.5">{value}</span>
      <span className="text-[8px] font-black opacity-50 uppercase tracking-tighter">{label}</span>
    </div>
  )
}
