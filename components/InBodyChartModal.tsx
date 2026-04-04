'use client'

import { X, Lock, TrendingUp } from 'lucide-react'
import type { InBodyRecord } from '@/lib/types'
import InBodyHistory from './InBodyHistory'

interface InBodyChartModalProps {
  records: InBodyRecord[]
  isPro: boolean
  onClose: () => void
  onUpgrade: () => void
}

export default function InBodyChartModal({ records, isPro, onClose, onUpgrade }: InBodyChartModalProps) {
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
              <TrendingUp size={14} className="text-[#0F9E75]" />
            </div>
            <h2 className="font-bold text-slate-800">Progress Charts</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 80px)' }}>
          <div className="p-5 relative">
            {/* Chart (blurred if not Pro) */}
            <div
              style={isPro ? undefined : {
                filter: 'blur(5px)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <InBodyHistory records={records} />
            </div>

            {/* Paywall overlay */}
            {!isPro && (
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
