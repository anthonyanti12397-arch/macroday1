'use client'

import { useState } from 'react'
import type { InBodyRecord } from '@/lib/types'

interface InBodyHistoryProps {
  records: InBodyRecord[]
}

const W = 600
const H = 200
const PAD = { top: 20, right: 20, bottom: 40, left: 44 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

function scaleY(value: number, min: number, max: number): number {
  if (max === min) return PAD.top + CHART_H / 2
  return PAD.top + CHART_H - ((value - min) / (max - min)) * CHART_H
}

function scaleX(index: number, total: number): number {
  if (total === 1) return PAD.left + CHART_W / 2
  return PAD.left + (index / (total - 1)) * CHART_W
}

function toPolyline(pts: { x: number; y: number }[]) {
  return pts.map((p) => `${p.x},${p.y}`).join(' ')
}

export default function InBodyHistory({ records }: InBodyHistoryProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  if (records.length < 2) return null

  // Only include records that have the optional field
  const fatRecords = records.filter((r) => r.bodyFat != null)
  const muscleRecords = records.filter((r) => r.skeletalMuscleMass != null)
  const weightRecords = records // weight is always present

  // Decide what to chart: prefer fat+muscle if available, else fall back to weight trend
  const hasFat = fatRecords.length >= 2
  const hasMuscle = muscleRecords.length >= 2
  const showWeightFallback = !hasFat && !hasMuscle

  // Collect all values for Y axis scaling
  const allValues: number[] = [
    ...(hasFat ? fatRecords.map((r) => r.bodyFat!) : []),
    ...(hasMuscle ? muscleRecords.map((r) => r.skeletalMuscleMass!) : []),
    ...(showWeightFallback ? weightRecords.map((r) => r.weight) : []),
  ]

  if (allValues.length === 0) return null

  const minVal = Math.floor(Math.min(...allValues)) - 1
  const maxVal = Math.ceil(Math.max(...allValues)) + 1

  // Points — each series uses its own filtered record list for X positioning
  const fatPoints = fatRecords.map((r, i) => ({
    x: scaleX(i, fatRecords.length),
    y: scaleY(r.bodyFat!, minVal, maxVal),
    record: r,
  }))
  const musclePoints = muscleRecords.map((r, i) => ({
    x: scaleX(i, muscleRecords.length),
    y: scaleY(r.skeletalMuscleMass!, minVal, maxVal),
    record: r,
  }))
  const weightPoints = weightRecords.map((r, i) => ({
    x: scaleX(i, weightRecords.length),
    y: scaleY(r.weight, minVal, maxVal),
    record: r,
  }))

  const tickCount = 5
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const val = minVal + ((maxVal - minVal) / (tickCount - 1)) * i
    return { val: val.toFixed(1), y: scaleY(val, minVal, maxVal) }
  })

  // Summary helpers
  const firstFat = fatRecords[0]?.bodyFat
  const lastFat = fatRecords[fatRecords.length - 1]?.bodyFat
  const firstMuscle = muscleRecords[0]?.skeletalMuscleMass
  const lastMuscle = muscleRecords[muscleRecords.length - 1]?.skeletalMuscleMass
  const firstWeight = records[0].weight
  const lastWeight = records[records.length - 1].weight

  // Use all records for X-axis labels (based on which set has most coverage)
  const xAxisRecords = hasFat ? fatRecords : hasMuscle ? muscleRecords : weightRecords

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-100">Progress Chart</h3>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 300 }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid lines + Y labels */}
          {ticks.map((t) => (
            <g key={t.val}>
              <line
                x1={PAD.left} y1={t.y}
                x2={W - PAD.right} y2={t.y}
                stroke="#e4e4e7" strokeWidth={0.8} strokeDasharray="4,4"
              />
              <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize={10} fill="#a1a1aa">
                {t.val}
              </text>
            </g>
          ))}

          {/* X-axis date labels */}
          {xAxisRecords.map((r, i) => (
            <text
              key={r.id}
              x={scaleX(i, xAxisRecords.length)}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#a1a1aa"
            >
              {r.date.slice(5)}
            </text>
          ))}

          {/* Body fat line + dots */}
          {hasFat && (
            <>
              <polyline
                points={toPolyline(fatPoints)}
                fill="none" stroke="#D85A30" strokeWidth={2}
                strokeLinejoin="round" strokeLinecap="round"
              />
              {fatPoints.map((p, i) => (
                <circle
                  key={`fat-${i}`} cx={p.x} cy={p.y} r={4} fill="#D85A30"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTooltip({ x: p.x, y: p.y - 10, text: `${p.record.date}: ${p.record.bodyFat}% fat` })
                  }
                />
              ))}
            </>
          )}

          {/* Muscle mass line + dots */}
          {hasMuscle && (
            <>
              <polyline
                points={toPolyline(musclePoints)}
                fill="none" stroke="#0F9E75" strokeWidth={2}
                strokeLinejoin="round" strokeLinecap="round"
              />
              {musclePoints.map((p, i) => (
                <circle
                  key={`muscle-${i}`} cx={p.x} cy={p.y} r={4} fill="#0F9E75"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTooltip({ x: p.x, y: p.y - 10, text: `${p.record.date}: ${p.record.skeletalMuscleMass}kg muscle` })
                  }
                />
              ))}
            </>
          )}

          {/* Weight fallback line + dots */}
          {showWeightFallback && (
            <>
              <polyline
                points={toPolyline(weightPoints)}
                fill="none" stroke="#7F77DD" strokeWidth={2}
                strokeLinejoin="round" strokeLinecap="round"
              />
              {weightPoints.map((p, i) => (
                <circle
                  key={`weight-${i}`} cx={p.x} cy={p.y} r={4} fill="#7F77DD"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTooltip({ x: p.x, y: p.y - 10, text: `${p.record.date}: ${p.record.weight}kg` })
                  }
                />
              ))}
            </>
          )}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x - 5, W - 160)} y={tooltip.y - 18}
                width={155} height={22} rx={4} fill="#18181b" opacity={0.85}
              />
              <text
                x={Math.min(tooltip.x, W - 82)} y={tooltip.y - 3}
                textAnchor="middle" fontSize={11} fill="#fff"
              >
                {tooltip.text}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {hasFat && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D85A30] inline-block" />
            <span className="text-zinc-700 dark:text-zinc-300">Body Fat</span>
          </span>
        )}
        {hasMuscle && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0F9E75] inline-block" />
            <span className="text-zinc-700 dark:text-zinc-300">Muscle Mass</span>
          </span>
        )}
        {showWeightFallback && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7F77DD] inline-block" />
            <span className="text-zinc-700 dark:text-zinc-300">Weight</span>
          </span>
        )}
      </div>

      {/* Summary cards — only show metrics that have data */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Weight"
          first={`${firstWeight}kg`}
          last={`${lastWeight}kg`}
          delta={lastWeight - firstWeight}
          unit="kg"
          higherIsBetter={false}
        />
        {hasFat && firstFat != null && lastFat != null && (
          <SummaryCard
            label="Body Fat"
            first={`${firstFat}%`}
            last={`${lastFat}%`}
            delta={lastFat - firstFat}
            unit="%"
            higherIsBetter={false}
          />
        )}
        {hasMuscle && firstMuscle != null && lastMuscle != null && (
          <SummaryCard
            label="Muscle Mass"
            first={`${firstMuscle}kg`}
            last={`${lastMuscle}kg`}
            delta={lastMuscle - firstMuscle}
            unit="kg"
            higherIsBetter={true}
          />
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label, first, last, delta, unit, higherIsBetter,
}: {
  label: string; first: string; last: string; delta: number; unit: string; higherIsBetter: boolean
}) {
  const positive = higherIsBetter ? delta >= 0 : delta <= 0
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{first} → {last}</p>
      <p className={`text-xs font-semibold ${positive ? 'text-[#0F9E75]' : 'text-[#D85A30]'}`}>
        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}{unit}
      </p>
    </div>
  )
}
