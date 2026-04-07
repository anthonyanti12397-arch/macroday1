'use client'

import { useState } from 'react'
import type { WeeklyPlan } from '@/lib/types'
import MealCard from './MealCard'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MealPlanGridProps {
  plan: WeeklyPlan
}

export default function MealPlanGrid({ plan }: MealPlanGridProps) {
  const [dayIdx, setDayIdx] = useState(0)
  const currentDay = plan.days[dayIdx]

  const nextDay = () => setDayIdx((prev) => (prev + 1) % plan.days.length)
  const prevDay = () => setDayIdx((prev) => (prev - 1 + plan.days.length) % plan.days.length)

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className="flex items-center justify-between px-1">
        <button onClick={prevDay} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} className="text-slate-400" />
        </button>
        
        <div className="flex-1 overflow-x-auto no-scrollbar flex justify-center gap-2 py-1 mx-2">
          {plan.days.map((day, idx) => (
            <button
              key={day.date}
              onClick={() => setDayIdx(idx)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                dayIdx === idx
                  ? 'bg-[#0F9E75] text-white shadow-lg shadow-[#0F9E75]/20'
                  : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {day.date.split(' ')[0].substring(0, 3)}
            </button>
          ))}
        </div>

        <button onClick={nextDay} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Swipeable Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dayIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Day header summary */}
          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentDay.date}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentDay.totalCalories} kcal total</p>
            </div>
            <div className="flex gap-1.5 pb-1">
               <DayChip label="P" value={`${currentDay.totalProtein}g`} color="protein" />
               <DayChip label="C" value={`${currentDay.totalCarbs}g`} color="carbs" />
            </div>
          </div>

          {/* Meal cards */}
          <div className="space-y-4">
            <MealCard meal={currentDay.breakfast} mealType="Breakfast" />
            <MealCard meal={currentDay.lunch} mealType="Lunch" />
            <MealCard meal={currentDay.dinner} mealType="Dinner" />
            {currentDay.snack && <MealCard meal={currentDay.snack} mealType="Snack" />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function DayChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    protein: 'bg-[#0F9E75]/10 text-[#0F9E75]',
    carbs: 'bg-[#E09B20]/10 text-[#E09B20]',
    fat: 'bg-[#D85A30]/10 text-[#D85A30]',
    zinc: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${colorMap[color] ?? colorMap.zinc}`}>
      {label} {value}
    </span>
  )
}
