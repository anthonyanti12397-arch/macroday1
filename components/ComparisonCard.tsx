'use client'

import { InBodyRecord } from '@/lib/types'
import { ArrowDown, ArrowUp, Minus, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ComparisonCard({ current, initial }: { current: InBodyRecord; initial: InBodyRecord }) {
  const diffs = {
    weight: current.weight - initial.weight,
    bodyFat: (current.bodyFat ?? 0) - (initial.bodyFat ?? 0),
    muscle: (current.skeletalMuscleMass ?? 0) - (initial.skeletalMuscleMass ?? 0),
  }

  return (
    <div className="card-lg p-6 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <TrendingUp size={80} />
      </div>
      
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2 text-lg">
          <TrendingUp className="text-[#0F9E75]" size={20} />
          Progress Summary
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
          Since {initial.date}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CompareStat label="Weight" current={current.weight} unit="kg" diff={diffs.weight} invert />
        {current.bodyFat != null && initial.bodyFat != null && (
          <CompareStat label="Body Fat" current={current.bodyFat} unit="%" diff={diffs.bodyFat} invert />
        )}
        {current.skeletalMuscleMass != null && initial.skeletalMuscleMass != null && (
          <CompareStat label="Muscle" current={current.skeletalMuscleMass} unit="kg" diff={diffs.muscle} />
        )}
      </div>
    </div>
  )
}

function CompareStat({ label, current, unit, diff, invert }: { label: string; current: number; unit: string; diff: number; invert?: boolean }) {
  const isPositive = diff > 0
  const isNeutral = Math.abs(diff) < 0.1
  const isGood = invert ? !isPositive : isPositive
  
  const color = isNeutral ? 'text-slate-400' : (isGood ? 'text-[#0F9E75]' : 'text-rose-500')
  const bg = isNeutral ? 'bg-slate-50' : (isGood ? 'bg-[#E8F5F0]' : 'bg-rose-50')
  const Icon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown)

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <div className="space-y-1">
        <p className="text-xl font-black text-slate-800 leading-none">{current}<span className="text-xs font-bold text-slate-400 ml-0.5">{unit}</span></p>
        <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg ${bg} ${color} text-[10px] font-black`}>
          <Icon size={10} />
          {Math.abs(diff).toFixed(1)}
        </div>
      </div>
    </div>
  )
}
