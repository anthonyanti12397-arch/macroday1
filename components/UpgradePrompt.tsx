'use client'

import { X, Zap, Infinity as InfinityIcon, Calendar, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { toast } from 'sonner'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession, signIn } from 'next-auth/react'
import { PRO_TRIAL_DAYS } from '@/lib/constants'

interface UpgradePromptProps {
  onClose: () => void
  onUpgrade: () => void
}

export default function UpgradePrompt({ onClose, onUpgrade }: UpgradePromptProps) {
  const { lang, t } = useLang()
  const { data: session } = useSession()
  const u = t.upgrade
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(mode: 'pro' | 'adfree' = 'pro') {
    // 檢查是否已登入
    if (!session?.user?.id) {
      toast.info(lang === 'zh' ? '請先登入您的帳戶' : 'Please log in first')
      await signIn()
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      const data = await res.json()

      // 如果收到 requiresAuth，重新導向到登入
      if (res.status === 401 && data.requiresAuth) {
        toast.info(lang === 'zh' ? '請先登入您的帳戶' : 'Please log in first')
        await signIn()
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout failed')
      }
    } catch (err) {
      console.error('[UpgradePrompt] Error:', err)
      toast.error(lang === 'zh' ? '支付跳轉失敗，請稍後再試' : 'Payment redirect failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Zap size={22} className="text-[#7F77DD]" />
          <h2 className="text-xl font-bold">{u.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">{u.desc}</p>

        {/* Pro Plan Primary Card */}
        <div className="bg-gradient-to-br from-[#7F77DD] to-[#6A61D1] rounded-2xl p-5 mb-4 text-white shadow-lg shadow-purple-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">PRO PLAN</span>
            <Sparkles size={16} />
          </div>
          
          <ul className="space-y-2 mb-4">
            {[
              { icon: InfinityIcon, text: u.feature1 },
              { icon: Calendar, text: u.feature2 },
              { icon: ShoppingCart, text: u.feature3 },
              { icon: TrendingUp, text: u.feature4 },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-[11px] font-medium text-white/90">
                <Icon size={14} className="shrink-0" />
                {text}
              </li>
            ))}
          </ul>

          <div className="bg-white/10 rounded-xl p-3 mb-4 text-center">
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">{PRO_TRIAL_DAYS} Days Free Trial</p>
            <p className="text-lg font-black text-white">$HK 38<span className="text-xs font-normal opacity-70"> / month</span></p>
          </div>

          <button 
             onClick={() => handleUpgrade('pro')}
             disabled={loading}
             className="w-full bg-white text-[#7F77DD] font-black py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '...' : (lang === 'zh' ? '開始免費試用' : 'Start Free Trial')}
          </button>
        </div>

        {/* Ad-Free Plan Secondary Card */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                 <Zap size={16} fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.adFreeTitle}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">HK$8</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight">{u.adFreeDesc}</p>
          <button 
             onClick={() => handleUpgrade('adfree')}
             disabled={loading}
             className="w-full bg-[#0F9E75] text-white text-[11px] font-bold py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '...' : (lang === 'zh' ? '立即移除廣告' : 'Remove Ads Now')}
          </button>
        </div>

        <button onClick={onClose} className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
          {u.later}
        </button>
      </div>
    </div>
  )
}
