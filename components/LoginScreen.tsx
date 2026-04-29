'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { saveGuestSession, saveLang } from '@/lib/storage'
import type { GuestSession } from '@/lib/types'
import Logo from './Logo'
import { Mail, ArrowRight, Users, Chrome, ChevronLeft, RefreshCw, Apple, Zap, BarChart3, ShoppingCart } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

interface LoginScreenProps {
  onLogin: (data?: GuestSession) => void
}

function randomGuestId(): string {
  const animals = ['Lion', 'Tiger', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Panda', 'Fox', 'Hawk', 'Lynx', 'Orca', 'Stag']
  const emojis: Record<string, string> = {
    Lion: '🦁', Tiger: '🐯', Bear: '🐻', Wolf: '🐺', Eagle: '🦅',
    Shark: '🦈', Panda: '🐼', Fox: '🦊', Hawk: '🦅', Lynx: '🐱', Orca: '🐋', Stag: '🦌',
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tag = ''
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${emojis[animal]} ${animal} #${tag}`
}

type Step = 'landing' | 'email' | 'otp'

// ── Demo card that cycles through sample meal plans ───────────────────────
const DEMO_PLANS = [
  {
    name: '💪 Muscle Gain',
    nameZh: '💪 增肌計畫',
    cal: 2650, protein: 195, carbs: 280, fat: 75,
    meals: ['雞胸米飯便當', '吞拿魚沙拉', '牛肉炒蔬菜'],
    mealsEn: ['Chicken Rice Bowl', 'Tuna Salad', 'Beef Stir-fry'],
  },
  {
    name: '🔥 Fat Loss',
    nameZh: '🔥 減脂計畫',
    cal: 1750, protein: 160, carbs: 130, fat: 60,
    meals: ['燕麥蛋白奶昔', '烤三文魚沙拉', '豆腐蔬菜湯'],
    mealsEn: ['Oat Protein Shake', 'Grilled Salmon Salad', 'Tofu Veggie Soup'],
  },
  {
    name: '⚖️ Maintain',
    nameZh: '⚖️ 維持體重',
    cal: 2100, protein: 145, carbs: 230, fat: 70,
    meals: ['蛋炒飯', '豬扒飯', '清蒸魚飯'],
    mealsEn: ['Egg Fried Rice', 'Pork Chop Rice', 'Steamed Fish'],
  },
]

function DemoMacroCard({ lang }: { lang: 'en' | 'zh' }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % DEMO_PLANS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const plan = DEMO_PLANS[idx]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.35 }}
        className="w-full rounded-2xl border border-[#0F9E75]/20 bg-white dark:bg-slate-800/60 p-4 shadow-sm text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#0F9E75]">{lang === 'zh' ? plan.nameZh : plan.name}</span>
          <span className="text-xs text-slate-400">{lang === 'zh' ? '每日平均' : 'daily avg'}</span>
        </div>
        {/* Macro row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: lang === 'zh' ? '卡路里' : 'Cal', value: plan.cal, unit: 'kcal', color: 'text-violet-500' },
            { label: lang === 'zh' ? '蛋白質' : 'Protein', value: plan.protein, unit: 'g', color: 'text-emerald-500' },
            { label: lang === 'zh' ? '碳水' : 'Carbs', value: plan.carbs, unit: 'g', color: 'text-amber-500' },
            { label: lang === 'zh' ? '脂肪' : 'Fat', value: plan.fat, unit: 'g', color: 'text-rose-500' },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className={`text-base font-black ${m.color}`}>{m.value}</div>
              <div className="text-[10px] text-slate-400">{m.unit}</div>
              <div className="text-[10px] text-slate-500">{m.label}</div>
            </div>
          ))}
        </div>
        {/* Sample meals */}
        <div className="space-y-1">
          {(lang === 'zh' ? plan.meals : plan.mealsEn).map((meal, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-[10px]">{['🌅','☀️','🌙'][i]}</span>
              <span>{meal}</span>
            </div>
          ))}
        </div>
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {DEMO_PLANS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-[#0F9E75] w-4' : 'bg-slate-200 dark:bg-slate-600 w-1.5'}`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { isDark } = useTheme()
  const systemLang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [lang, setLang] = useState<'en' | 'zh'>(systemLang)
  const [step, setStep] = useState<Step>('landing')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpToken, setOtpToken] = useState('')  // signed token from server
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(v => v - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const c = {
    en: {
      tagline: 'Your AI-powered daily nutrition coach',
      sub: 'Personalised meals based on your body data',
      google: 'Continue with Google',
      emailBtn: 'Continue with Email',
      emailPlaceholder: 'your@email.com',
      sendCode: 'Send verification code',
      sending: 'Sending…',
      otpTitle: 'Check your inbox',
      otpSub: (e: string) => `We sent a 6-digit code to ${e}`,
      verify: 'Verify & sign in',
      verifying: 'Verifying…',
      resend: 'Resend code',
      resendIn: (s: number) => `Resend in ${s}s`,
      wrongEmail: 'Wrong email?',
      guest: 'Continue as Guest',
      guestNote: 'No account · Data saved on this device',
      invalidEmail: 'Please enter a valid email address',
      otpError: 'Invalid code. Please try again.',
      networkError: 'Something went wrong. Please try again.',
      divider: 'or',
    },
    zh: {
      tagline: 'AI 每日飲食教練',
      sub: '根據你的身體數據，生成個人化三餐',
      google: '以 Google 繼續',
      emailBtn: '以 Email 繼續',
      emailPlaceholder: 'your@email.com',
      sendCode: '發送驗證碼',
      sending: '發送中…',
      otpTitle: '請查看你的郵箱',
      otpSub: (e: string) => `我們已向 ${e} 發送了 6 位數驗證碼`,
      verify: '驗證並登入',
      verifying: '驗證中…',
      resend: '重新發送',
      resendIn: (s: number) => `${s}秒後重新發送`,
      wrongEmail: '電郵填錯了？',
      guest: '以訪客身份繼續',
      guestNote: '不需要帳號 · 資料儲存在此裝置',
      invalidEmail: '請輸入有效的電郵地址',
      otpError: '驗證碼錯誤，請重試',
      networkError: '網絡錯誤，請稍後再試',
      divider: '或',
    },
  }[lang]

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSendOTP() {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(c.invalidEmail)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { token?: string; error?: string }
      if (!res.ok || !data.token) throw new Error(data.error ?? 'failed')
      setOtpToken(data.token)
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
      setResendCooldown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      setError(c.networkError)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    setError('')
    const code = otp.join('')
    if (code.length !== 6) return
    setLoading(true)
    try {
      const result = await signIn('email-otp', {
        email,
        otp: code,
        token: otpToken,
        redirect: false,
      })
      if (result?.error) {
        setError(c.otpError)
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
      // AuthGate will detect the new session and re-render automatically
    } catch {
      setError(c.networkError)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { token?: string; error?: string }
      if (!res.ok || !data.token) throw new Error()
      setOtpToken(data.token)
      setOtp(['', '', '', '', '', ''])
      setResendCooldown(60)
      otpRefs.current[0]?.focus()
    } catch {
      setError(c.networkError)
    } finally {
      setLoading(false)
    }
  }

  function handleOTPInput(idx: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[idx] = value.slice(-1)
    setOtp(next)
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === 6) {
      // Auto-submit when all 6 digits entered
      setTimeout(() => {
        setOtp(next)
        // trigger via form-like approach
      }, 0)
    }
  }

  function handleOTPKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  function handleOTPPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  function handleGuest() {
    setLoading(true)
    saveLang(lang)
    const session: GuestSession = {
      id: randomGuestId(),
      isGuest: true,
      createdAt: new Date().toISOString(),
    }
    saveGuestSession(session)
    setTimeout(() => {
      setLoading(false)
      onLogin(session)
    }, 500)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-10 overflow-y-auto"
      style={{ background: isDark ? 'linear-gradient(160deg, #0a1628 0%, #0F172A 50%, #0F172A 100%)' : 'linear-gradient(160deg, #EDF9F4 0%, #F8FFFE 50%, #ffffff 100%)' }}
    >
      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        {step !== 'landing' ? (
          <button
            onClick={() => { setStep(step === 'otp' ? 'email' : 'landing'); setError('') }}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={16} /> {lang === 'zh' ? '返回' : 'Back'}
          </button>
        ) : <div />}
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-full hover:border-[#0F9E75] transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      {/* Hero (landing only) */}
      {step === 'landing' && (
        <div className="flex flex-col items-center text-center gap-4 flex-1 justify-center py-4 w-full max-w-sm">
          {/* Glow */}
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }}
          />

          <Logo lang={lang} size="lg" className="relative" />

          {/* Headline */}
          <div className="space-y-1.5 relative">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
              {lang === 'zh'
                ? <>AI 幫你計劃<br /><span className="text-[#0F9E75]">每日三餐</span> 的宏量</>
                : <>AI meal plans,<br /><span className="text-[#0F9E75]">built for your body</span></>
              }
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {lang === 'zh'
                ? '輸入你的目標和體型，AI 幫你規劃一週三餐 + 購物清單，蛋白質不再猜'
                : 'Tell us your goal. Get a full week of meals with exact macros — no guesswork.'}
            </p>
          </div>

          {/* Animated demo card */}
          <DemoMacroCard lang={lang} />

          {/* Social proof */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex -space-x-1.5">
              {['🧑‍💻','👩‍🍳','🧑‍🏋️','👨‍⚕️','👩‍💼'].map((e, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#0F172A] flex items-center justify-center text-[10px]">{e}</div>
              ))}
            </div>
            <span>{lang === 'zh' ? '已有超過 500 人使用' : '500+ people tracking macros'}</span>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: <Zap size={11} />, label: lang === 'zh' ? 'AI 即時生成' : 'AI in seconds' },
              { icon: <BarChart3 size={11} />, label: lang === 'zh' ? '宏量追蹤' : 'Macro tracking' },
              { icon: <ShoppingCart size={11} />, label: lang === 'zh' ? '購物清單' : 'Shopping list' },
            ].map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] dark:bg-[#0F9E75]/10 px-3 py-1.5 rounded-full">
                {f.icon}{f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Email input step */}
      {step === 'email' && (
        <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center py-8 w-full max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mb-2">
            <Mail size={28} className="text-[#0F9E75]" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{c.emailBtn}</p>
          <p className="text-sm text-slate-400 max-w-xs">
            {lang === 'zh' ? '輸入你的電郵，我們會發送一個驗證碼' : 'Enter your email and we\'ll send a verification code'}
          </p>
        </div>
      )}

      {/* OTP step header */}
      {step === 'otp' && (
        <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center py-8 w-full max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mb-2">
            <span className="text-3xl">📬</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{c.otpTitle}</p>
          <p className="text-sm text-slate-400 max-w-xs">{c.otpSub(email)}</p>
        </div>
      )}

      {/* Bottom CTA area */}
      <div className="w-full max-w-sm space-y-3">
        {error && (
          <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center">
            {error}
          </div>
        )}

        {/* ── LANDING ── */}
        {step === 'landing' && (
          <>
            <button
              onClick={() => signIn('apple', { callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-black dark:bg-black text-white text-sm font-semibold hover:bg-slate-900 transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Apple size={18} />
              <span>{lang === 'zh' ? '使用 Apple 登入' : 'Continue with Apple'}</span>
            </button>

            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Chrome size={18} className="text-slate-500 dark:text-slate-400" />
              <span>{c.google}</span>
            </button>

            <button
              onClick={() => { setStep('email'); setError('') }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-[#0F9E75] transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Mail size={18} className="text-slate-500 dark:text-slate-400" />
              <span>{c.emailBtn}</span>
              <ArrowRight size={15} className="ml-auto text-slate-400 dark:text-slate-500" />
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{c.divider}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            </div>

            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-70 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.35)' }}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Users size={17} />{c.guest}<ArrowRight size={15} className="ml-auto" /></>
              }
            </button>
            <p className="text-center text-[11px] text-slate-400">{c.guestNote}</p>
          </>
        )}

        {/* ── EMAIL INPUT ── */}
        {step === 'email' && (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              placeholder={c.emailPlaceholder}
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0F9E75] focus:ring-2 focus:ring-[#0F9E75]/20 transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            />
            <button
              onClick={handleSendOTP}
              disabled={loading || !email}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.35)' }}
            >
              {loading
                ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : c.sendCode
              }
            </button>
          </>
        )}

        {/* ── OTP INPUT ── */}
        {step === 'otp' && (
          <>
            {/* 6-box OTP input */}
            <div className="flex gap-2 justify-center" onPaste={handleOTPPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOTPInput(i, e.target.value)}
                  onKeyDown={e => handleOTPKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all"
                  style={{
                    borderColor: digit ? '#0F9E75' : '#E2E8F0',
                    background: digit ? '#F0FDF9' : '#ffffff',
                    color: '#0F172A',
                    boxShadow: digit ? '0 0 0 3px rgba(15,158,117,0.15)' : 'none',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.35)' }}
            >
              {loading
                ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : c.verify
              }
            </button>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => { setStep('email'); setError('') }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {c.wrongEmail}
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] disabled:text-slate-400 transition-colors"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {resendCooldown > 0 ? c.resendIn(resendCooldown) : c.resend}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
