'use client'

import { signIn } from 'next-auth/react'
import { useState, useRef } from 'react'
import { Apple, Chrome, Mail, X, Loader2, ChevronLeft, RefreshCw } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface SignInPromptProps {
  title?: string
  description?: string
  onClose?: () => void
}

type Step = 'buttons' | 'email' | 'otp'

export default function SignInPrompt({
  title = "Sign in to MacroDay",
  description = "Sync your data across devices and unlock all features",
  onClose
}: SignInPromptProps) {
  const { lang } = useLang()
  const [loading, setLoading] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('buttons')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpToken, setOtpToken] = useState('')
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  if (lang === 'zh') {
    title = '登入 MacroDay'
    description = '同步您的數據，解鎖所有功能'
  }

  const handleSignIn = async (provider: string) => {
    setLoading(provider)
    try {
      await signIn(provider, { callbackUrl: '/' })
    } finally {
      setLoading(null)
    }
  }

  const handleSendOTP = async () => {
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(lang === 'zh' ? '請輸入有效的電郵地址' : 'Please enter a valid email address')
      return
    }
    setLoading('email')
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
      const interval = setInterval(() => setResendCooldown(v => {
        if (v <= 1) { clearInterval(interval); return 0 }
        return v - 1
      }), 1000)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      setError(lang === 'zh' ? '網絡錯誤，請稍後再試' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    const code = otp.join('')
    if (code.length !== 6) return
    setLoading('verify')
    try {
      const result = await signIn('email-otp', {
        email,
        otp: code,
        token: otpToken,
        redirect: false,
        callbackUrl: '/',
      })
      if (result?.error) {
        setError(lang === 'zh' ? '驗證碼錯誤，請重試' : 'Invalid code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError(lang === 'zh' ? '網絡錯誤，請稍後再試' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setLoading('resend')
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
      const interval = setInterval(() => setResendCooldown(v => {
        if (v <= 1) { clearInterval(interval); return 0 }
        return v - 1
      }), 1000)
      otpRefs.current[0]?.focus()
    } catch {
      setError(lang === 'zh' ? '網絡錯誤，請稍後再試' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleOTPInput = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[idx] = value.slice(-1)
    setOtp(next)
    if (value && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOTPKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 flex items-center gap-2">
            {step !== 'buttons' && (
              <button
                onClick={() => { setStep(step === 'otp' ? 'email' : 'buttons'); setError('') }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -ml-1"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                {step === 'email'
                  ? (lang === 'zh' ? '以 Email 繼續' : 'Continue with Email')
                  : step === 'otp'
                    ? (lang === 'zh' ? '請查看你的郵箱' : 'Check your inbox')
                    : title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === 'email'
                  ? (lang === 'zh' ? '輸入你的電郵，我們會發送一個驗證碼' : "Enter your email and we'll send a verification code")
                  : step === 'otp'
                    ? (lang === 'zh' ? `我們已向 ${email} 發送了 6 位數驗證碼` : `We sent a 6-digit code to ${email}`)
                    : description}
              </p>
            </div>
          </div>
          {onClose && step === 'buttons' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mt-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center">
            {error}
          </div>
        )}

        {/* ── BUTTONS STEP ── */}
        {step === 'buttons' && (
          <div className="space-y-3">
            <button
              onClick={() => handleSignIn('apple')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#000' }}
            >
              {loading === 'apple' ? <Loader2 size={16} className="animate-spin" /> : <Apple size={16} />}
              {lang === 'zh' ? '使用 Apple 登入' : 'Continue with Apple'}
            </button>

            <button
              onClick={() => handleSignIn('google')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? <Loader2 size={16} className="animate-spin" /> : <Chrome size={16} />}
              {lang === 'zh' ? '使用 Google 登入' : 'Continue with Google'}
            </button>

            <button
              onClick={() => { setStep('email'); setError('') }}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={16} />
              {lang === 'zh' ? '使用電郵登入' : 'Continue with Email'}
            </button>
          </div>
        )}

        {/* ── EMAIL INPUT STEP ── */}
        {step === 'email' && (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              placeholder="your@email.com"
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-[#0F9E75] focus:ring-2 focus:ring-[#0F9E75]/20 transition-all"
            />
            <button
              onClick={handleSendOTP}
              disabled={loading !== null || !email}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
            >
              {loading === 'email'
                ? <Loader2 size={16} className="animate-spin mx-auto" />
                : (lang === 'zh' ? '發送驗證碼' : 'Send verification code')}
            </button>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step === 'otp' && (
          <div className="space-y-3">
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
                  className="w-11 h-13 text-center text-xl font-black rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: digit ? '#0F9E75' : '#E2E8F0',
                    background: digit ? '#F0FDF9' : '#ffffff',
                    color: '#0F172A',
                    height: '52px',
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading !== null || otp.join('').length !== 6}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
            >
              {loading === 'verify'
                ? <Loader2 size={16} className="animate-spin mx-auto" />
                : (lang === 'zh' ? '驗證並登入' : 'Verify & sign in')}
            </button>
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => { setStep('email'); setError('') }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {lang === 'zh' ? '電郵填錯了？' : 'Wrong email?'}
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading !== null}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] disabled:text-slate-400 transition-colors"
              >
                <RefreshCw size={12} className={loading === 'resend' ? 'animate-spin' : ''} />
                {resendCooldown > 0
                  ? (lang === 'zh' ? `${resendCooldown}秒後重新發送` : `Resend in ${resendCooldown}s`)
                  : (lang === 'zh' ? '重新發送' : 'Resend code')}
              </button>
            </div>
          </div>
        )}

        {/* Legal text */}
        {step === 'buttons' && (
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            {lang === 'zh'
              ? '按登入代表您同意我們的服務條款和隱私政策'
              : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
          </p>
        )}
      </div>
    </div>
  )
}
