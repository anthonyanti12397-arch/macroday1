'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { saveGuestSession, saveLang } from '@/lib/storage'
import type { GuestSession } from '@/lib/types'
import Logo from './Logo'
import { Mail, ArrowRight, Users, Chrome, ChevronLeft, RefreshCw } from 'lucide-react'

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

export default function LoginScreen({ onLogin }: LoginScreenProps) {
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
      style={{ background: 'linear-gradient(160deg, #EDF9F4 0%, #F8FFFE 50%, #ffffff 100%)' }}
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
          className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-[#0F9E75] transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      {/* Logo + tagline (landing only) */}
      {step === 'landing' && (
        <div className="flex flex-col items-center text-center gap-5 flex-1 justify-center py-8">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }}
          />
          <Logo lang={lang} size="lg" className="relative" />
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-800 leading-snug">{c.tagline}</p>
            <p className="text-sm text-slate-500 max-w-xs">{c.sub}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {(lang === 'zh'
              ? ['早午晚三餐', '身體數據追蹤', 'AI 個人化', '購物清單']
              : ['3 meals/day', 'Body tracking', 'AI personalised', 'Shopping list']
            ).map((f) => (
              <span key={f} className="text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] px-3 py-1 rounded-full">{f}</span>
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
          <p className="text-xl font-bold text-slate-800">{c.emailBtn}</p>
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
          <p className="text-xl font-bold text-slate-800">{c.otpTitle}</p>
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
              onClick={() => { setStep('email'); setError('') }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-[#0F9E75] transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Mail size={18} className="text-slate-500" />
              <span>{c.emailBtn}</span>
              <ArrowRight size={15} className="ml-auto text-slate-400" />
            </button>

            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <Chrome size={18} className="text-slate-500" />
              <span>{c.google}</span>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">{c.divider}</span>
              <div className="flex-1 h-px bg-slate-200" />
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
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#0F9E75] focus:ring-2 focus:ring-[#0F9E75]/20 transition-all"
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
