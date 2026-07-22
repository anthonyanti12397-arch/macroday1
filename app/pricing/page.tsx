'use client'

import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import {
  PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL, PRO_TRIAL_DAYS,
  FREE_DAILY_LIMIT, MAX_AD_REWARDS_PER_DAY, PRO_DAILY_CAP,
} from '@/lib/constants'
import { useLang } from '@/contexts/LangContext'
import { toast } from 'sonner'

export default function PricingPage() {
  const { data: session } = useSession()
  const { lang } = useLang()
  const zh = lang === 'zh'
  const [loading, setLoading] = useState(false)
  const [interval, setInterval] = useState<'month' | 'year'>('year')

  // Annual saving vs 12x monthly, as a percentage.
  const annualSavingPct = Math.round((1 - PRO_PRICE_ANNUAL / (PRO_PRICE_MONTHLY * 12)) * 100)

  async function handleUpgrade() {
    if (!session?.user?.id) {
      toast.info(zh ? '請先登入' : 'Please log in first')
      await signIn()
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pro', interval }),
      })
      const data = await res.json()
      if (res.status === 401 && data.requiresAuth) {
        toast.info(zh ? '請先登入' : 'Please log in first')
        await signIn()
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
      else toast.error(data.error || (zh ? '結帳失敗' : 'Checkout failed'))
    } catch (err) {
      console.error('[Pricing] Checkout error:', err)
      toast.error(zh ? '無法前往結帳，請重試' : 'Payment redirect failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const plusFeatures = zh
    ? [
        '無廣告，乾淨體驗',
        `每日最多 ${PRO_DAILY_CAP} 次 AI 生成`,
        '無限換餐與 7 日餐單計劃',
        '雲端同步 InBody 記錄與餐單（跨裝置）',
        '社群發文、留言與打卡分享',
        '優先支援與進階食譜',
      ]
    : [
        'No ads, clean experience',
        `Up to ${PRO_DAILY_CAP} AI generations per day`,
        'Unlimited swaps and 7-day meal plans',
        'Cloud sync for InBody and plans across devices',
        'Community posting, replies, and check-in sharing',
        'Priority support and premium recipes',
      ]

  const price = interval === 'year' ? PRO_PRICE_ANNUAL : PRO_PRICE_MONTHLY
  const perLabel = interval === 'year' ? (zh ? '/ 年' : '/yr') : (zh ? '/ 月' : '/mo')

  return (
    <div className="py-6 space-y-6">
      {/* Hero */}
      <div className="rounded-[2rem] p-6 text-white" style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0B7A68 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} />
          <span className="text-xs font-black uppercase tracking-[0.25em]">MacroDay Plus</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">
          {zh ? '解鎖無廣告 + 更貼身的 AI 餐單' : 'Unlock ad-free meals built around your body'}
        </h1>
        <p className="text-white/80 text-sm">
          {zh
            ? `先免費試用 ${PRO_TRIAL_DAYS} 天，之後 $${PRO_PRICE_MONTHLY}/月 或 $${PRO_PRICE_ANNUAL}/年。`
            : `Start with a ${PRO_TRIAL_DAYS}-day free trial, then $${PRO_PRICE_MONTHLY}/mo or $${PRO_PRICE_ANNUAL}/yr.`}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          {(['month', 'year'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setInterval(opt)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                interval === opt
                  ? 'bg-white dark:bg-slate-700 text-[#0F9E75] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {opt === 'month' ? (zh ? '月付' : 'Monthly') : (zh ? '年付' : 'Annual')}
              {opt === 'year' && annualSavingPct > 0 && (
                <span className="ml-1.5 text-[10px] font-black text-[#0F9E75]">
                  {zh ? `省 ${annualSavingPct}%` : `-${annualSavingPct}%`}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Two-tier comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="card-lg p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            {zh ? '免費版' : 'Free'}
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4">$0</p>
          <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <FeatureLine>{zh ? `每日 ${FREE_DAILY_LIMIT} 次 AI 生成` : `${FREE_DAILY_LIMIT} AI generations/day`}</FeatureLine>
            <FeatureLine>{zh ? `看廣告每日最多再 +${MAX_AD_REWARDS_PER_DAY} 次` : `Watch ads for up to +${MAX_AD_REWARDS_PER_DAY}/day`}</FeatureLine>
            <FeatureLine>{zh ? '含廣告' : 'Includes ads'}</FeatureLine>
          </div>
        </div>

        {/* Plus */}
        <div className="card-lg p-5 ring-2 ring-[#0F9E75] relative">
          <span className="absolute -top-2.5 right-4 text-[10px] font-black uppercase tracking-wider text-white bg-[#0F9E75] px-2 py-0.5 rounded-md">
            {zh ? '推薦' : 'Popular'}
          </span>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0F9E75] mb-1">Plus</p>
          <p className="mb-4">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">${price}</span>
            <span className="text-sm font-semibold text-slate-400 ml-1">{perLabel}</span>
          </p>
          <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
            {plusFeatures.map((f) => <FeatureLine key={f} check>{f}</FeatureLine>)}
          </div>
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-60 active:scale-[0.99] transition-transform"
        style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
      >
        {loading
          ? (zh ? '正在前往結帳…' : 'Redirecting to checkout…')
          : (zh ? `開始 ${PRO_TRIAL_DAYS} 天免費試用` : `Start ${PRO_TRIAL_DAYS}-day free trial`)}
      </button>
      <p className="text-center text-xs text-slate-400">
        {zh ? '隨時可取消，取消後於當期結束生效。' : 'Cancel anytime; takes effect at period end.'}
      </p>
    </div>
  )
}

function FeatureLine({ children, check = false }: { children: React.ReactNode; check?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${check ? 'bg-[#E8F5F0] dark:bg-[#0F9E75]/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
        <Check size={12} className={check ? 'text-[#0F9E75]' : 'text-slate-400'} />
      </div>
      <span>{children}</span>
    </div>
  )
}
