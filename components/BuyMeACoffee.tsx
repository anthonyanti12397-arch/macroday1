'use client'

import { Coffee, ChevronRight } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface BuyMeACoffeeProps {
  variant?: 'card' | 'button'
  className?: string
}

export default function BuyMeACoffee({ variant = 'card', className = '' }: BuyMeACoffeeProps) {
  const { lang } = useLang()

  const content = {
    zh: {
      title: '請開發者喝杯咖啡 ☕',
      desc: '支持 MacroDay 持續開發',
    },
    en: {
      title: 'Buy me a coffee ☕',
      desc: 'Support MacroDay development',
    }
  }[lang]

  const href = "https://buymeacoffee.com/anthonyantm"

  if (variant === 'button') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
        style={{ background: 'linear-gradient(135deg, #FFDD00 0%, #FFC800 100%)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
          <Coffee size={20} className="text-[#1a1a1a]" />
        </div>
        <div className="flex-1">
          <p className="text-[#1a1a1a] font-bold text-sm">{content.title}</p>
          <p className="text-[#1a1a1a]/60 text-xs">{content.desc}</p>
        </div>
        <ChevronRight size={16} className="text-[#1a1a1a]/40" />
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-[#FFC800] transition-colors ${className}`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" 
        style={{ background: 'linear-gradient(135deg, #FFDD00 0%, #FFC800 100%)' }}
      >
        <Coffee size={22} className="text-[#1a1a1a]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{content.title}</p>
        <p className="text-xs text-slate-400">{content.desc}</p>
      </div>
      <span className="text-slate-300 text-lg shrink-0">›</span>
    </a>
  )
}
