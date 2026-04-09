'use client'

import { useEffect, useState } from 'react'

interface Props {
  value: number
  target: number
  size?: number
  strokeWidth?: number
  color?: string
  label: string
  unit: string
}

export default function ProgressRing({
  value, target, size = 76, strokeWidth = 6,
  color = '#0F9E75', label, unit,
}: Props) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = target > 0 ? Math.min(value / target, 1) : 0
  const offset = circumference * (1 - animated)
  const displayPct = Math.round(pct * 100)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ overflow: 'visible' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-slate-800 leading-none">{displayPct}%</span>
        </div>
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-600">
        {value}<span className="text-slate-400 font-normal text-[10px]">{unit}</span>
      </p>
    </div>
  )
}
