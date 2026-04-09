'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { Meal } from '@/lib/types'
import { useLang } from '@/contexts/LangContext'

interface CookModeProps {
  meal: Meal
  onClose: () => void
}

export default function CookMode({ meal, onClose }: CookModeProps) {
  const { lang } = useLang()
  const [step, setStep] = useState(0)
  const steps = meal.steps

  const isLast = step === steps.length - 1
  const isDone = step >= steps.length

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-safe-top pt-6 pb-4 border-b" style={{ borderColor: 'var(--border-card)' }}>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#0F9E75] uppercase tracking-wider mb-0.5">
            {lang === 'zh' ? '烹飪模式' : 'Cook Mode'}
          </p>
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{meal.name}</p>
        </div>
        <span className="text-xs font-bold text-slate-400">{isDone ? steps.length : step + 1}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--border-card)' }}>
        <div
          className="h-full bg-[#0F9E75] transition-all duration-500"
          style={{ width: `${isDone ? 100 : ((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {!isDone ? (
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
              <span className="text-2xl font-black text-[#0F9E75]">{step + 1}</span>
            </div>
            <p className="text-xl font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {steps[step]}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <CheckCircle2 size={64} className="text-[#0F9E75] mx-auto" />
            <p className="text-2xl font-black text-[#0F9E75]">
              {lang === 'zh' ? '完成！' : 'Done!'}
            </p>
            <p className="text-sm text-slate-400">
              {lang === 'zh' ? `${meal.name} 準備好了，享用吧！` : `${meal.name} is ready. Enjoy!`}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-safe flex gap-3" style={{ background: 'var(--bg-page)' }}>
        {step > 0 && !isDone && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center"
            style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {!isDone ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex-1 h-14 btn-primary rounded-2xl text-base font-bold flex items-center justify-center gap-2"
          >
            {isLast
              ? (lang === 'zh' ? '完成！' : 'Done!')
              : (lang === 'zh' ? '下一步' : 'Next')}
            {!isLast && <ChevronRight size={18} />}
          </button>
        ) : (
          <button onClick={onClose} className="flex-1 h-14 btn-primary rounded-2xl text-base font-bold">
            {lang === 'zh' ? '返回餐單' : 'Back to meal'}
          </button>
        )}
      </div>
    </div>
  )
}
