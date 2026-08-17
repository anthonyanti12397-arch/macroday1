'use client'

import { Check, Sparkles, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import {
  FREE_DAILY_LIMIT, MAX_AD_REWARDS_PER_DAY,
} from '@/lib/constants'
import { useLang } from '@/contexts/LangContext'

/**
 * MacroDay is ad-supported — there is no paid tier. This page exists to explain
 * how the free model works (and because Stripe's cancel_url still points here).
 */
export default function PricingPage() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  const features = zh
    ? [
        'AI 每日三餐餐單，依你的 InBody 數據個人化',
        '7 日餐單計劃與購物清單',
        '無限換餐',
        '拍照識別食物',
        '訓練計劃與進度圖表',
        '雲端同步（登入後跨裝置）',
        '社群發文與打卡分享',
      ]
    : [
        'AI daily meals personalised from your InBody data',
        '7-day meal plans and shopping lists',
        'Unlimited meal swaps',
        'Photo food recognition',
        'Training plans and progress charts',
        'Cloud sync across devices (when signed in)',
        'Community posting and check-in sharing',
      ]

  return (
    <div className="py-6 space-y-6">
      <div className="rounded-[2rem] p-6 text-white" style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0B7A68 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} />
          <span className="text-xs font-black uppercase tracking-[0.25em]">
            {zh ? '完全免費' : 'Completely free'}
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">
          {zh ? '全功能免費，由廣告支持' : 'All features free, supported by ads'}
        </h1>
        <p className="text-white/80 text-sm leading-relaxed">
          {zh
            ? '沒有訂閱、沒有付費牆。廣告收入用來支付 AI 運算費用。'
            : 'No subscriptions, no paywall. Ad revenue covers the AI costs.'}
        </p>
      </div>

      {/* How quota works */}
      <div className="card-lg p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0F9E75] mb-4">
          {zh ? '每日配額如何運作' : 'How daily quota works'}
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] dark:bg-[#0F9E75]/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-[#0F9E75]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {zh ? `每日 ${FREE_DAILY_LIMIT} 次免費生成` : `${FREE_DAILY_LIMIT} free generations daily`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {zh ? '每天自動重置，不用做任何事。' : 'Resets automatically every day.'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] dark:bg-[#0F9E75]/20 flex items-center justify-center shrink-0">
              <PlayCircle size={15} className="text-[#0F9E75]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {zh ? `看廣告最多再 +${MAX_AD_REWARDS_PER_DAY} 次` : `Watch ads for up to +${MAX_AD_REWARDS_PER_DAY} more`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {zh
                  ? '用完免費配額後，看一段短廣告就能再生成一次。'
                  : 'Out of free quota? One short ad unlocks one more generation.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Everything included */}
      <div className="card-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0F9E75] mb-4">
          {zh ? '全部功能都包含' : 'Everything included'}
        </p>
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E8F5F0] dark:bg-[#0F9E75]/20 flex items-center justify-center shrink-0">
                <Check size={14} className="text-[#0F9E75]" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/"
        className="block w-full py-4 rounded-2xl text-white font-black text-base text-center active:scale-[0.99] transition-transform"
        style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
      >
        {zh ? '開始使用' : 'Start using MacroDay'}
      </Link>
    </div>
  )
}
