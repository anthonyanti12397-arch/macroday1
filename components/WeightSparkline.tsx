'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getInBodyHistory } from '@/lib/storage'
import type { InBodyRecord } from '@/lib/types'
import { useLang } from '@/contexts/LangContext'

export default function WeightSparkline() {
  const { lang } = useLang()
  const [records, setRecords] = useState<InBodyRecord[]>([])

  useEffect(() => {
    const history = getInBodyHistory()
    // Take last 6 records max
    setRecords(history.slice(-6))
  }, [])

  if (records.length < 2) return null

  const weights = records.map(r => r.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const latest = weights[weights.length - 1]
  const first = weights[0]
  const diff = +(latest - first).toFixed(1)
  const W = 120, H = 36, pad = 4

  const points = weights.map((w, i) => {
    const x = pad + (i / (weights.length - 1)) * (W - pad * 2)
    const y = pad + ((max - w) / range) * (H - pad * 2)
    return `${x},${y}`
  })
  const polyline = points.join(' ')
  const lastPt = points[points.length - 1].split(',')

  const TrendIcon = diff < -0.1 ? TrendingDown : diff > 0.1 ? TrendingUp : Minus
  const trendColor = diff < -0.1 ? '#0F9E75' : diff > 0.1 ? '#D85A30' : '#94A3B8'

  return (
    <div className="card-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
            {lang === 'zh' ? '體重趨勢' : 'Weight Trend'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{latest}<span className="text-sm font-bold text-slate-400 ml-0.5">kg</span></span>
            <div className="flex items-center gap-1" style={{ color: trendColor }}>
              <TrendIcon size={14} />
              <span className="text-xs font-bold">{diff > 0 ? '+' : ''}{diff}kg</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {lang === 'zh' ? `vs ${records[0].date.slice(5)}` : `vs ${records[0].date.slice(5)}`}
          </p>
        </div>
        <svg width={W} height={H} className="overflow-visible">
          <defs>
            <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${pad},${H} ${polyline} ${W - pad},${H}`}
            fill="url(#spark-fill)"
          />
          <polyline
            points={polyline}
            fill="none"
            stroke={trendColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={lastPt[0]}
            cy={lastPt[1]}
            r="3.5"
            fill={trendColor}
          />
        </svg>
      </div>
    </div>
  )
}
