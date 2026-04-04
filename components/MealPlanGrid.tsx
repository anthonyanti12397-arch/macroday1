'use client'

import type { WeeklyPlan } from '@/lib/types'
import MealCard from './MealCard'

interface MealPlanGridProps {
  plan: WeeklyPlan
}

export default function MealPlanGrid({ plan }: MealPlanGridProps) {
  return (
    <div className="space-y-6">
      {plan.days.map((day) => (
        <div key={day.date} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 space-y-3">
          {/* Day header */}
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
            {day.date}
          </h3>

          {/* Meal cards */}
          <div className="space-y-2">
            <MealCard meal={day.breakfast} mealType="Breakfast" />
            <MealCard meal={day.lunch} mealType="Lunch" />
            <MealCard meal={day.dinner} mealType="Dinner" />
            {day.snack && <MealCard meal={day.snack} mealType="Snack" />}
          </div>

          {/* Daily totals */}
          <div className="flex flex-wrap gap-2 pt-1">
            <DayChip label="Total" value={`${day.totalCalories} kcal`} color="zinc" />
            <DayChip label="P" value={`${day.totalProtein}g`} color="protein" />
            <DayChip label="C" value={`${day.totalCarbs}g`} color="carbs" />
            <DayChip label="F" value={`${day.totalFat}g`} color="fat" />
          </div>
        </div>
      ))}
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
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${colorMap[color] ?? colorMap.zinc}`}>
      {label}: {value}
    </span>
  )
}
