'use client'

import { X, Lock, TrendingUp } from 'lucide-react'
import type { InBodyRecord } from '@/lib/types'
import InBodyHistory from './InBodyHistory'
import Logo from './Logo'

interface InBodyChartModalProps {
  records: InBodyRecord[]
  isPro: boolean
  onClose: () => void
  onUpgrade: () => void
  // Coach flow: name of the person these charts belong to (shown in the header
  // and the shareable card so a screenshot is self-identifying).
  subjectName?: string
  // When true (viewing a client), the charts are never paywalled — the coach is
  // the paying party and these are the core coach feature.
  coachView?: boolean
}

export default function InBodyChartModal({ records, isPro, onClose, onUpgrade, subjectName, coachView = false }: InBodyChartModalProps) {
  const unlocked = isPro || coachView
  const dates = records.map((r) => r.date).filter(Boolean).sort()
  const dateRange = dates.length >= 2 ? `${dates[0]} → ${dates[dates.length - 1]}` : dates[0] ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="relative w-full bg-white rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '88vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-[#E8F5F0] flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="text-[#0F9E75]" />
            </div>
            <h2 className="font-bold text-slate-800 truncate">
              {subjectName ? `${subjectName} · 進度` : 'Progress Charts'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
          >
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 80px)' }}>
          <div className="p-5 relative">
            {/* Shareable branded header — only in coach view, designed for screenshots */}
            {coachView && subjectName && (
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#0F9E75] to-[#0c7d5d] p-4 text-white flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">InBody 進度報告</p>
                  <p className="text-lg font-black truncate">{subjectName}</p>
                  {dateRange && <p className="text-[11px] text-white/80 font-medium">{dateRange}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Logo iconOnly size="sm" variant="white" />
                  <span className="font-black text-sm">MacroDay</span>
                </div>
              </div>
            )}

            {/* Chart (blurred only for the consumer self-view without Pro) */}
            <div
              style={unlocked ? undefined : {
                filter: 'blur(5px)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <InBodyHistory records={records} />
            </div>

            {/* Coach share hint */}
            {coachView && records.length >= 2 && (
              <p className="mt-4 text-center text-[11px] text-slate-400">
                截圖此畫面即可分享給學生 📸
              </p>
            )}

            {/* Paywall overlay — consumer self-view only */}
            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div
                  className="bg-white rounded-3xl p-7 text-center space-y-4 w-full"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#F0EEFF] flex items-center justify-center mx-auto">
                    <Lock size={24} className="text-[#7F77DD]" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg mb-1">Pro 功能</p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      解鎖體重、體脂、肌肉量進度圖表，追蹤你的身體變化趨勢
                    </p>
                  </div>
                  <button
                    onClick={onUpgrade}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7F77DD 0%, #9B8FE8 100%)',
                      boxShadow: '0 4px 14px rgba(127,119,221,0.4)',
                    }}
                  >
                    升級 Pro · 解鎖圖表
                  </button>
                  <p className="text-[11px] text-slate-400">HK$38/月 · 隨時取消</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
