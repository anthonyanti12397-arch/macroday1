'use client'

import { useState } from 'react'
import { saveGuestSession, saveLang } from '@/lib/storage'
import type { GuestSession } from '@/lib/types'
import Logo from './Logo'
import { Phone, Mail, Chrome, ArrowRight, Users } from 'lucide-react'

interface LoginScreenProps {
  onLogin: () => void
}

function randomGuestId(): string {
  const animals = ['Lion', 'Tiger', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Panda', 'Fox', 'Hawk', 'Lynx', 'Orca', 'Stag']
  const emojis: Record<string, string> = { Lion: '🦁', Tiger: '🐯', Bear: '🐻', Wolf: '🐺', Eagle: '🦅', Shark: '🦈', Panda: '🐼', Fox: '🦊', Hawk: '🦅', Lynx: '🐱', Orca: '🐋', Stag: '🦌' }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let tag = ''
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${emojis[animal]} ${animal} #${tag}`
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const systemLang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en'
  const [lang, setLang] = useState<'en' | 'zh'>(systemLang)
  const [loading, setLoading] = useState(false)

  const copy = {
    en: {
      tagline: 'Your AI-powered daily nutrition coach',
      sub: 'Personalised meals based on your body data',
      phone: 'Continue with Phone',
      email: 'Continue with Email',
      google: 'Continue with Google',
      comingSoon: 'Coming Soon',
      divider: 'or',
      guest: 'Continue as Guest',
      guestNote: 'No account needed · Data saved on this device',
    },
    zh: {
      tagline: 'AI 每日飲食教練',
      sub: '根據你的身體數據，生成個人化三餐',
      phone: '以電話號碼繼續',
      email: '以 Email 繼續',
      google: '以 Google 繼續',
      comingSoon: '即將推出',
      divider: '或',
      guest: '以訪客身份繼續',
      guestNote: '不需要帳號・資料儲存在此裝置',
    },
  }[lang]

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
      onLogin()
    }, 600)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 py-10 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #EDF9F4 0%, #F8FFFE 50%, #ffffff 100%)' }}
    >
      {/* Lang toggle */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-[#0F9E75] transition-colors"
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      {/* Logo + tagline */}
      <div className="flex flex-col items-center text-center gap-5 flex-1 justify-center py-8">
        {/* Decorative glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }}
        />

        <Logo lang={lang} size="lg" className="relative" />

        <div className="space-y-2">
          <p className="text-xl font-bold text-slate-800 leading-snug">{copy.tagline}</p>
          <p className="text-sm text-slate-500 max-w-xs">{copy.sub}</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {(lang === 'zh'
            ? ['早午晚三餐', '身體數據追蹤', 'AI 個人化', '購物清單']
            : ['3 meals/day', 'Body tracking', 'AI personalised', 'Shopping list']
          ).map((f) => (
            <span key={f} className="text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] px-3 py-1 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Login options */}
      <div className="w-full max-w-sm space-y-3">
        {/* Social logins (disabled) */}
        {[
          { icon: Phone, label: copy.phone },
          { icon: Mail, label: copy.email },
          { icon: Chrome, label: copy.google },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            disabled
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-400 cursor-not-allowed relative"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Icon size={18} className="text-slate-300" />
            <span>{label}</span>
            <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
              {copy.comingSoon}
            </span>
          </button>
        ))}

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">{copy.divider}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Guest login */}
        <button
          onClick={handleGuest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-70 transition-all active:scale-98"
          style={{
            background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)',
            boxShadow: '0 4px 16px rgba(15,158,117,0.35)',
          }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Users size={17} />
              {copy.guest}
              <ArrowRight size={15} className="ml-auto" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400">{copy.guestNote}</p>
      </div>
    </div>
  )
}
