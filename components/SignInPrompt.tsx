'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Apple, Chrome, Mail, X, Loader2 } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface SignInPromptProps {
  title?: string
  description?: string
  onClose?: () => void
}

export default function SignInPrompt({
  title = "Sign in to MacroDay",
  description = "Sync your data across devices and unlock all features",
  onClose
}: SignInPromptProps) {
  const { lang } = useLang()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setLoading(provider)
    try {
      await signIn(provider, { callbackUrl: '/' })
    } finally {
      setLoading(provider === null)
    }
  }

  if (lang === 'zh') {
    title = '登入 MacroDay'
    description = '同步您的數據，解鎖所有功能'
  }

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mt-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sign In Buttons */}
        <div className="space-y-3">
          {/* Apple Sign In */}
          <button
            onClick={() => handleSignIn('apple')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#000' }}
          >
            {loading === 'apple' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Apple size={16} />
            )}
            {lang === 'zh' ? '使用 Apple 登入' : 'Continue with Apple'}
          </button>

          {/* Google Sign In */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Chrome size={16} />
            )}
            {lang === 'zh' ? '使用 Google 登入' : 'Continue with Google'}
          </button>

          {/* Email OTP Sign In */}
          <button
            onClick={() => handleSignIn('email-otp')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'email-otp' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            {lang === 'zh' ? '使用電郵登入' : 'Continue with Email'}
          </button>
        </div>

        {/* Legal text */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          {lang === 'zh'
            ? '按登入代表您同意我們的服務條款和隱私政策'
            : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
        </p>
      </div>
    </div>
  )
}
