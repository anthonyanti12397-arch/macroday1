'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useLang } from '@/contexts/LangContext'

interface Props {
  trigger: boolean
  onComplete?: () => void
}

export default function ConfettiCelebration({ trigger, onComplete }: Props) {
  const { lang } = useLang()

  useEffect(() => {
    if (!trigger) return

    // 第一波：從兩側射出
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#0F9E75', '#0BD68A', '#ffffff', '#E8F5F0'],
    })
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#0F9E75', '#0BD68A', '#ffffff', '#E8F5F0'],
    })

    // 第二波：中央爆發
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F9E75', '#0BD68A', '#FFF', '#E8F5F0'],
      })
    }, 350)

    const timer = setTimeout(() => onComplete?.(), 2600)
    return () => clearTimeout(timer)
  }, [trigger, onComplete])

  if (!trigger) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-center celebration-bounce">
        <div className="text-6xl mb-3">🎉</div>
        <p className="text-2xl font-black text-[#0F9E75] drop-shadow-sm">
          {lang === 'zh' ? '今日三餐準備好了！' : "Today's meals are ready!"}
        </p>
        <p className="text-slate-500 text-sm mt-1">
          {lang === 'zh' ? '開始享受健康飲食吧' : 'Enjoy your healthy meals'}
        </p>
      </div>
    </div>
  )
}
