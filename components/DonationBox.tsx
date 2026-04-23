'use client'

import { useState } from 'react'
import { Coffee, Heart, Loader2 } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getGuestSession } from '@/lib/storage'
import { useSession } from 'next-auth/react'

export default function DonationBox() {
  const { lang } = useLang()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(5)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)

  const amounts = [5, 10, 20]

  async function handleDonate() {
    const finalAmount = isCustom ? parseFloat(customAmount) : selectedAmount
    if (isNaN(finalAmount) || finalAmount < 1) {
      toast.error(lang === 'zh' ? '請輸入有效的金額 (最少 $1)' : 'Please enter a valid amount (min $1)')
      return
    }

    setLoading(true)
    try {
      const guestSession = getGuestSession()
      // 优先使用认证用户的 ID，否则使用游客 ID
      const userId = session?.user?.id || guestSession?.id || 'guest'

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'donate',
          amount: finalAmount
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast.error(lang === 'zh' ? '跳轉支付失敗' : 'Redirect to payment failed')
      setLoading(false)
    }
  }

  return (
    <div className="card-lg overflow-hidden bg-white">
      <div className="p-5 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDD00] flex items-center justify-center shrink-0 shadow-lg shadow-[#FFDD00]/20">
            <Coffee size={24} className="text-[#1a1a1a]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {lang === 'zh' ? '支持開發者 ☕' : 'Support the Developer ❤️'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {lang === 'zh' ? '你的支持是我們持續優化的動力' : 'Your support fuels MacroDay updates'}
            </p>
          </div>
        </div>

        {/* Amount Picker */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setIsCustom(false); }}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                  !isCustom && selectedAmount === amt
                    ? 'bg-[#1a1a1a] text-white shadow-md'
                    : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200'
                }`}
              >
                ${amt}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                isCustom
                  ? 'bg-[#1a1a1a] text-white shadow-md'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              {lang === 'zh' ? '其他' : 'Other'}
            </button>
          </div>

          <AnimatePresence>
            {isCustom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FFDD00]/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleDonate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#FFDD00] text-[#1a1a1a] font-black text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#FFC800] active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          style={{ boxShadow: '0 4px 16px rgba(255,221,0,0.3)' }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Heart size={16} fill="currentColor" />
              {lang === 'zh' ? '立即贊助' : 'Donate Now'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
