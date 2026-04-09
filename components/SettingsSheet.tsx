'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X, LogOut, Globe, Activity, Zap, Bell, Palette,
  ChevronRight, Crown, User, Check, Sun, Moon, Monitor,
} from 'lucide-react'
import { clearSession, getUserProfile, getGuestSession } from '@/lib/storage'
import { useSession } from 'next-auth/react'
import { BETA_MODE } from '@/lib/constants'
import DonationBox from '@/components/DonationBox'
import { useLang } from '@/contexts/LangContext'
import { useTheme } from '@/contexts/ThemeContext'
import UpgradePrompt from './UpgradePrompt'
import Logo from './Logo'

interface SettingsSheetProps {
  onClose: () => void
  onLogout: () => void
}

export default function SettingsSheet({ onClose, onLogout }: SettingsSheetProps) {
  const { lang, setLang, t } = useLang()
  const { theme, setTheme } = useTheme()
  const s = t.settings
  const profile = getUserProfile()
  const session = getGuestSession()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  function handleLogout() {
    if (!logoutConfirm) { setLogoutConfirm(true); return }
    clearSession()
    onLogout()
  }

  const avatarLetter = session?.id?.slice(6, 7) ?? 'G'
  const isPro = BETA_MODE || (profile?.isPro ?? false)
  const goalLabel = profile?.goal ? s.goalLabels[profile.goal] : '—'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet */}
        <div
          className="relative w-full rounded-t-3xl overflow-hidden"
          style={{ background: 'var(--bg-card)' }}
          style={{ maxHeight: '92vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
        >
          {/* Handle */}
          <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ background: 'var(--border-card)' }} />

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <Logo lang={lang} size="sm" />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            <div className="px-5 pb-32 space-y-5 mt-3">
              {/* ── Account card ─────────────────────────────────────── */}
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xl">{avatarLetter.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-bold text-sm truncate">{session?.id ?? 'Guest'}</p>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                      {s.guestBadge}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs">
                    {BETA_MODE ? (
                      <span className="flex items-center gap-1"><Zap size={11} className="text-yellow-300" /> Beta — All features unlocked</span>
                    ) : isPro ? (
                      <span className="flex items-center gap-1"><Crown size={11} className="text-yellow-300" /> Pro</span>
                    ) : 'Free plan'}
                  </p>
                </div>
                {!isPro && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="shrink-0 text-[11px] font-bold bg-white text-[#0F9E75] px-3 py-1.5 rounded-xl"
                  >
                    {s.upgradeBtn}
                  </button>
                )}
                {isPro && (
                  <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-yellow-300">
                    <Crown size={13} />
                    Pro
                  </div>
                )}
              </div>

              {/* ── Language ─────────────────────────────────────────── */}
              <Section title={s.langSection} icon={Globe}>
                <div className="flex gap-2 p-1">
                  {(['zh', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        lang === l
                          ? 'bg-[#0F9E75] text-white border-[#0F9E75]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F9E75]'
                      }`}
                    >
                      {lang === l && <Check size={13} />}
                      {l === 'zh' ? '中文' : 'English'}
                    </button>
                  ))}
                </div>
              </Section>

              {/* ── Fitness ──────────────────────────────────────────── */}
              <Section title={s.fitnessSection} icon={Activity}>
                <Row label={s.currentGoal} value={goalLabel} />
                <Link href="/inbody" onClick={onClose}>
                  <Row label={s.editBodyData} chevron />
                </Link>
              </Section>

              {/* ── App ──────────────────────────────────────────────── */}
              <Section title={s.appSection} icon={Palette}>
                <div className="px-4 py-3.5">
                  <span className="text-sm font-medium text-slate-700 block mb-2.5">{s.appearance}</span>
                  <div className="flex gap-2">
                    {([
                      { value: 'system', icon: Monitor, label: lang === 'zh' ? '自動' : 'Auto' },
                      { value: 'light',  icon: Sun,     label: lang === 'zh' ? '淺色' : 'Light' },
                      { value: 'dark',   icon: Moon,    label: lang === 'zh' ? '深色' : 'Dark' },
                    ] as const).map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          theme === value
                            ? 'bg-[#0F9E75] text-white border-[#0F9E75]'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#0F9E75]'
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Row label={s.notifications} icon={Bell} badge={s.comingSoon} />
              </Section>

              {/* ── Pro ──────────────────────────────────────────────── */}
              {!isPro && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7F77DD 0%, #9B8FE8 100%)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{s.upgradeBtn}</p>
                    <p className="text-white/70 text-xs">{s.upgradeDesc}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/60" />
                </button>
              )}

              {isPro && (
                <Section title={s.proSection} icon={Crown}>
                  <Row
                    label="MacroDay Pro"
                    value={<span className="text-[#7F77DD] font-bold text-xs">{s.proActive}</span>}
                  />
                </Section>
              )}

              {/* ── Support ──────────────────────────────────────────── */}
              <DonationBox />

              {/* ── Logout ───────────────────────────────────────────── */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
                    logoutConfirm
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogOut size={15} />
                    {logoutConfirm ? s.confirmLogout : s.logoutBtn}
                  </span>
                  {logoutConfirm && (
                    <p className="text-xs font-normal text-white/80 mt-0.5">{s.logoutDesc}</p>
                  )}
                </button>
                {logoutConfirm && (
                  <button
                    onClick={() => setLogoutConfirm(false)}
                    className="w-full mt-2 text-sm text-slate-400 py-2"
                  >
                    {s.cancel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => { setShowUpgrade(false); onClose() }}
        />
      )}
    </>
  )
}

function Section({
  title, icon: Icon, children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-1 mb-2">
        <Icon size={12} className="text-slate-400" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <div className="rounded-2xl border overflow-hidden divide-y"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({
  label, value, chevron, badge, icon: Icon,
}: {
  label: string
  value?: React.ReactNode
  chevron?: boolean
  badge?: string
  icon?: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {Icon && <Icon size={15} className="text-slate-400 shrink-0" />}
      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {value && <span className="text-sm text-slate-500">{value}</span>}
      {chevron && <ChevronRight size={15} className="text-slate-300" />}
    </div>
  )
}
