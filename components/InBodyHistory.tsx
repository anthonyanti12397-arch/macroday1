'use client'

import { useState, useMemo } from 'react'
import type { InBodyRecord } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity, Target, Zap } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface InBodyHistoryProps {
  records: InBodyRecord[]
}

type Metric = 'weight' | 'bodyFat' | 'skeletalMuscleMass' | 'bmr' | 'bodyWater'

const W = 600
const H = 250
const PAD = { top: 30, right: 30, bottom: 50, left: 50 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

export default function InBodyHistory({ records }: InBodyHistoryProps) {
  const { lang, t } = useLang()
  const [activeMetric, setActiveMetric] = useState<Metric>('weight')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const metrics: { id: Metric; label: string; unit: string; color: string; bg: string }[] = [
    { id: 'weight', label: lang === 'zh' ? '體重' : 'Weight', unit: 'kg', color: '#0F9E75', bg: '#0F9E7515' },
    { id: 'bodyFat', label: lang === 'zh' ? '體脂' : 'Body Fat', unit: '%', color: '#E09B20', bg: '#E09B2015' },
    { id: 'skeletalMuscleMass', label: lang === 'zh' ? '肌肉' : 'Muscle', unit: 'kg', color: '#D85A30', bg: '#D85A3015' },
    { id: 'bmr', label: 'BMR', unit: 'kcal', color: '#7F77DD', bg: '#7F77DD15' },
    { id: 'bodyWater', label: lang === 'zh' ? '水分' : 'Water', unit: '%', color: '#3B82F6', bg: '#3B82F615' },
  ]

  const activeInfo = metrics.find(m => m.id === activeMetric)!

  // Prepare chart data for active metric (filter nulls)
  const data = useMemo(() => {
    return records
      .filter(r => r[activeMetric] != null)
      .map((r, i) => ({
        x: i,
        val: r[activeMetric] as number,
        date: r.date,
        original: r
      }))
  }, [records, activeMetric])

  if (data.length < 1) {
    return (
      <div className="card-lg p-8 text-center bg-slate-50 border-dashed border-2 flex flex-col items-center gap-3">
        <Activity size={24} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-400">
          {lang === 'zh' ? `尚無足夠的 ${activeInfo.label} 數據進行繪圖` : `Not enough ${activeInfo.label} data for chart`}
        </p>
      </div>
    )
  }

  const vals = data.map(d => d.val)
  const minVal = Math.min(...vals)
  const maxVal = Math.max(...vals)
  const range = maxVal - minVal || 1
  const yMin = minVal - range * 0.2
  const yMax = maxVal + range * 0.2

  const getX = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * CHART_W : CHART_W / 2)
  const getY = (v: number) => PAD.top + CHART_H - ((v - yMin) / (yMax - yMin)) * CHART_H

  // Create SVG path string (curved)
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.val) }))
  
  const linePath = points.length > 1 
    ? points.reduce((acc, p, i, arr) => {
        if (i === 0) return `M ${p.x},${p.y}`
        const prev = arr[i - 1]
        const cp1x = prev.x + (p.x - prev.x) / 2
        return `${acc} C ${cp1x},${prev.y} ${cp1x},${p.y} ${p.x},${p.y}`
      }, '')
    : ''

  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x},${PAD.top + CHART_H} L ${points[0].x},${PAD.top + CHART_H} Z`
    : ''

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
        {metrics.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMetric === m.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        {data.length >= 2 && (() => {
          const first = data[0].val
          const last = data[data.length - 1].val
          const diff = last - first
          const isGood = (activeMetric === 'skeletalMuscleMass' || activeMetric === 'bmr' || activeMetric === 'bodyWater') 
            ? diff > 0 
            : diff < 0
          return (
            <>
              <div className="card p-4 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'zh' ? '累計變化' : 'Total Change'}</span>
                <div className={`text-xl font-black flex items-center gap-1 ${diff === 0 ? 'text-slate-800' : isGood ? 'text-[#0F9E75]' : 'text-red-500'}`}>
                  {diff > 0 ? <TrendingUp size={18} /> : diff < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                  {Math.abs(diff).toFixed(1)} <span className="text-xs font-bold opacity-60">{activeInfo.unit}</span>
                </div>
              </div>
              <div className="card p-4 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'zh' ? '當前數值' : 'Current'}</span>
                <div className="text-xl font-black text-slate-800">
                  {last.toFixed(1)} <span className="text-xs font-bold opacity-40">{activeInfo.unit}</span>
                </div>
              </div>
            </>
          )
        })()}
      </div>

      {/* SVG Chart */}
      <div className="card-lg p-4 bg-white relative overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible touch-none">
          <defs>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeInfo.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={activeInfo.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines (Y) */}
          {[yMin, (yMin + yMax) / 2, yMax].map((tick, i) => (
            <g key={i}>
              <line 
                x1={PAD.left} y1={getY(tick)} 
                x2={W - PAD.right} y2={getY(tick)} 
                stroke="#F1F5F9" strokeWidth="1" 
              />
              <text x={PAD.left - 10} y={getY(tick) + 4} textAnchor="end" fontSize="10" fontWeight="bold" fill="#CBD5E1">
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <motion.path 
            key={`${activeMetric}-area`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            d={areaPath} 
            fill="url(#fillGrad)" 
          />

          {/* Main Curve */}
          <motion.path
            key={`${activeMetric}-line`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            d={linePath}
            stroke={activeInfo.color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Points + Interaction area */}
          {data.map((d, i) => (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} onClick={() => setHoveredIdx(i)}>
              {/* Interaction zone */}
              <rect x={getX(i) - 20} y={PAD.top} width="40" height={CHART_H} fill="transparent" />
              
              {/* Point dot */}
              <circle
                cx={getX(i)}
                cy={getY(d.val)}
                r={hoveredIdx === i ? 6 : 4}
                fill={activeInfo.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
              />
              
              {/* X Axis Label */}
              <text
                x={getX(i)}
                y={H - 15}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={hoveredIdx === i ? "#64748B" : "#CBD5E1"}
              >
                {d.date.split('-').slice(1).join('/')}
              </text>
            </g>
          ))}

          {/* Active Tooltip */}
          {hoveredIdx !== null && (
            <g>
              <line 
                x1={getX(hoveredIdx)} y1={PAD.top} x2={getX(hoveredIdx)} y2={H - PAD.bottom} 
                stroke={activeInfo.color} strokeWidth="1" strokeDasharray="4,2" 
              />
              <rect 
                x={getX(hoveredIdx) - 40} y={getY(data[hoveredIdx].val) - 35} 
                width="80" height="25" rx="8" 
                fill="#1E293B" shadow-sm
              />
              <text 
                x={getX(hoveredIdx)} y={getY(data[hoveredIdx].val) - 18} 
                textAnchor="middle" fill="white" fontSize="11" fontWeight="bold"
              >
                {data[hoveredIdx].val.toFixed(1)}{activeInfo.unit}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Target Insights */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          {lang === 'zh' ? '數據洞察' : 'AI INSIGHTS'}
        </h4>
        <div className="card-lg p-5 flex items-start gap-4">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${activeInfo.bg}`}>
             <Zap size={20} className="text-slate-800" style={{ color: activeInfo.color }} />
           </div>
           <div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                {activeInfo.label} {data.length >= 2 ? (data[data.length-1].val > data[0].val ? (lang === 'zh' ? '呈上升趨勢' : 'Trending Up') : (lang === 'zh' ? '呈下降趨勢' : 'Trending Down')) : (lang === 'zh' ? '正在收集數據' : 'Gathering data')}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'zh' 
                  ? `根據你的 ${activeInfo.label} 變化，AI 已調整你的飲食建議以更精確地對接你的目標。` 
                  : `Based on your ${activeInfo.label} trajectory, our AI has calibrated your macros to ensure you stay on track.`}
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
