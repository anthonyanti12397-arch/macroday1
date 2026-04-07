'use client'

import { saveUserProfile, getUserProfile } from '@/lib/storage'
import { X, Zap, Infinity, Calendar, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface UpgradePromptProps {
  onClose: () => void
  onUpgrade: () => void
}

export default function UpgradePrompt({ onClose, onUpgrade }: UpgradePromptProps) {
  const { lang, t } = useLang()
  const u = t.upgrade

  function handleUpgrade() {
    const profile = getUserProfile()
    if (profile) {
      saveUserProfile({ ...profile, isPro: true })
    } else {
      saveUserProfile({
        goal: 'maintain', dietaryRestrictions: [],
        proteinPreferences: [], carbPreferences: [],
        cookingStyle: 'both', cuisinePreferences: [], isPro: true,
      })
    }
    onUpgrade()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Zap size={22} className="text-[#7F77DD]" />
          <h2 className="text-xl font-bold">{u.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{u.desc}</p>

        <ul className="space-y-3 mb-6">
          {[
            { icon: Infinity, text: u.feature1 },
            { icon: Calendar, text: u.feature2 },
            { icon: ShoppingCart, text: u.feature3 },
            { icon: TrendingUp, text: u.feature4 },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
              <Icon size={16} className="text-[#7F77DD] shrink-0" />
              {text}
            </li>
          ))}
        </ul>

        <div className="bg-[#7F77DD]/10 border border-[#7F77DD]/20 rounded-2xl p-4 mb-6 text-center">
            <p className="text-[10px] font-black text-[#7F77DD] uppercase tracking-[0.2em] mb-1">Limited Beta Offer</p>
            <p className="text-2xl font-black text-[#7F77DD] tracking-tight">$1 <span className="text-sm font-bold opacity-60">Lifetime</span></p>
            <p className="text-[10px] font-bold text-[#7F77DD]/60 mt-1">One-time payment. Forever access.</p>
        </div>

        <button onClick={handleUpgrade}
          className="w-full font-black py-4 rounded-2xl text-white transition-all active:scale-95 shadow-lg shadow-[#7F77DD]/20"
          style={{ background: 'linear-gradient(135deg, #7F77DD 0%, #9B8FE8 100%)' }}>
          {lang === 'zh' ? '立即解鎖 $1 限時優惠' : 'Unlock $1 Lifetime Deal'}
        </button>

        <button onClick={onClose} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2">
          {u.later}
        </button>
      </div>
    </div>
  )
}
