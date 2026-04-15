'use client'

import { useState } from 'react'
import { Check, Sparkles, MessageSquare, Cloud, ChefHat } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { PRO_PRICE_MONTHLY, PRO_TRIAL_DAYS } from '@/lib/constants'

const FEATURES = [
  'Unlimited AI meal swaps and weekly plans',
  'Regional meal personalization for Argentina and beyond',
  'Forum posting, unlimited replies, and daily check-in sharing',
  'Cloud sync for InBody history and generated plans',
  'Priority support and premium recipe access',
]

export default function PricingPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user?.id, mode: 'pro' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-6 space-y-6">
      <div className="rounded-[2rem] p-6 text-white" style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0B7A68 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} />
          <span className="text-xs font-black uppercase tracking-[0.25em]">MacroDay Pro</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Train smarter with a plan that fits your culture</h1>
        <p className="text-white/80 text-sm">
          Start with a {PRO_TRIAL_DAYS}-day free trial, then continue at ${PRO_PRICE_MONTHLY}/month.
        </p>
      </div>

      <div className="grid gap-4">
        {[
          { icon: ChefHat, title: 'Regional AI meals', desc: 'Cuisine-aware prompts with local ingredient substitutions.' },
          { icon: MessageSquare, title: 'Community posting', desc: 'Share meal photos, streaks, and check-ins with the forum.' },
          { icon: Cloud, title: 'Cloud sync', desc: 'Keep your InBody records and plans across devices.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card-lg p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5F0] dark:bg-[#0F9E75]/20 flex items-center justify-center">
              <Icon size={18} className="text-[#0F9E75]" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">{title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-lg p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0F9E75] mb-4">Included</p>
        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#E8F5F0] dark:bg-[#0F9E75]/20 flex items-center justify-center">
                <Check size={14} className="text-[#0F9E75]" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
      >
        {loading ? 'Redirecting to checkout...' : `Start ${PRO_TRIAL_DAYS}-day free trial`}
      </button>
    </div>
  )
}
