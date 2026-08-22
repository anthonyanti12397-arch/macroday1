'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X, LogOut, Globe, Activity, Zap, Bell, Palette,
  ChevronRight, Crown, User, Check, Sun, Moon, Monitor, ShieldCheck, Trash2,
} from 'lucide-react'
import { clearSession, getUserProfile, getGuestSession, saveUserProfile } from '@/lib/storage'
import { useSession, signOut } from 'next-auth/react'
import { BETA_MODE, FREE_DAILY_LIMIT, MAX_AD_REWARDS_PER_DAY } from '@/lib/constants'
import DonationBox from '@/components/DonationBox'
import { useLang } from '@/contexts/LangContext'
import { useTheme } from '@/contexts/ThemeContext'
import UpgradePrompt from './UpgradePrompt'
import Logo from './Logo'
import SubscriptionManager from './SubscriptionManager'
import { toast } from 'sonner'

interface SettingsSheetProps {
  onClose: () => void
  onLogout: () => void
}

export default function SettingsSheet({ onClose, onLogout }: SettingsSheetProps) {
  const { lang, setLang, t } = useLang()
  const { theme, setTheme } = useTheme()
  const { data: authSession, status } = useSession()
  const s = t.settings
  const u = t.upgrade
  const profile = getUserProfile()
  const guestSession = getGuestSession()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // App Store guideline 5.1.1(v): an app offering account creation must let the
  // user delete that account from inside the app. Two-step confirm because this
  // is irreversible and cascades to every record the user owns.
  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }

    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) throw new Error('delete failed')

      // Wipe local data so the device keeps nothing after the server delete.
      try { localStorage.clear() } catch { /* storage unavailable */ }
      clearSession()

      await signOut({ redirect: false, callbackUrl: '/' })
      onLogout()
    } catch (err) {
      console.error('[Settings] Account deletion failed:', err)
      toast.error(lang === 'zh' ? '刪除帳號失敗，請稍後再試' : 'Could not delete account. Please try again.')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  async function handleLogout() {
    if (!logoutConfirm) { setLogoutConfirm(true); return }

    // Clear local storage
    clearSession()

    // Sign out from NextAuth (handles OAuth sessions)
    // For guest sessions, this just clears the session
    await signOut({
      redirect: false, // We'll handle redirect ourselves
      callbackUrl: '/'
    })

    // Call parent logout handler
    onLogout()
  }

  const accountName =
    status === 'authenticated'
      ? authSession?.user?.name || authSession?.user?.email || 'MacroDay User'
      : guestSession?.id ?? 'Guest'
  const isAuthenticated = status === 'authenticated'
  const avatarLetter = accountName.trim().charAt(0) || 'G'
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
          style={{ background: 'var(--bg-card)', maxHeight: '92vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
        >
          {/* Handle */}
          <div className="w-12 h-1.5 rounded-full mx-auto mt-3" style={{ background: 'var(--border-card)' }} />

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <Logo lang={lang} size="sm" />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X size={15} className="text-slate-500 dark:text-slate-400" />
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
                    <p className="text-white font-bold text-sm truncate">{accountName}</p>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                      {isAuthenticated ? 'Account' : s.guestBadge}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs">
                    {BETA_MODE ? (
                      <span className="flex items-center gap-1"><Zap size={11} className="text-yellow-300" /> Beta — All features unlocked</span>
                    ) : isPro ? (
                      <span className="flex items-center gap-1"><Crown size={11} className="text-yellow-300" /> Pro</span>
                    ) : (lang === 'zh' ? '免費版・廣告支持' : 'Free — ad-supported')}
                  </p>
                </div>
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
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0F9E75]'
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
                {/* Auto-generate switch */}
                <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.autoGenerateMeals}</span>
                    <button
                      onClick={async () => {
                        if (!isPro) { setShowUpgrade(true); return }
                        const newVal = !profile?.autoGenerateDaily
                        const updated = { ...profile!, autoGenerateDaily: newVal }
                        saveUserProfile(updated)
                        // Sync to DB if logged in
                        if (isAuthenticated) {
                          await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ autoGenerateDaily: newVal })
                          })
                        }
                        onClose() // Refresh state by closing or just state update?
                        window.location.reload() // Simple way to refresh profile state
                      }}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${profile?.autoGenerateDaily ? 'bg-[#0F9E75]' : 'bg-slate-300'}`}
                    >
                      <span className={`${profile?.autoGenerateDaily ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{s.autoGenerateDesc}</p>
                </div>
              </Section>

              {/* ── App ──────────────────────────────────────────────── */}
              <Section title={s.appSection} icon={Palette}>
                <div className="px-4 py-3.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2.5">{s.appearance}</span>
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
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-[#0F9E75]'
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

              {/* ── Ad-supported (no paid tier) ─────────────────────── */}
              <Section title={lang === 'zh' ? '關於配額' : 'About quota'} icon={Zap}>
                <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {lang === 'zh' ? 'MacroDay 全功能免費' : 'MacroDay is free, all features'}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'zh'
                      ? `每日可免費生成 ${FREE_DAILY_LIMIT} 次；用完後看廣告可再獲得配額（每日最多 ${MAX_AD_REWARDS_PER_DAY} 次）。廣告收入用於支付 AI 運算費用。`
                      : `${FREE_DAILY_LIMIT} free generations daily; watch an ad for more (up to ${MAX_AD_REWARDS_PER_DAY}/day). Ad revenue covers the AI costs.`}
                  </p>
                </div>
              </Section>

              {/* Legacy subscriber cards — only shown to anyone who already pays. */}
              {(profile?.isPro || profile?.isAdFree) && (
              <Section title={s.proSection} icon={Zap}>
                {profile?.isPro ? (
                  <div className="mx-4 p-4 rounded-2xl text-white transition-opacity hover:opacity-90 shadow-lg shadow-purple-200 dark:shadow-none mb-4"
                       style={{ background: 'linear-gradient(135deg, #7F77DD 0%, #6A61D1 100%)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Crown size={18} fill="currentColor" />
                        <span className="font-bold text-lg">MacroDay Pro</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {s.proActive}
                      </span>
                    </div>
                    <p className="text-xs text-purple-100/90 leading-tight">
                      {s.upgradeDesc}
                    </p>
                  </div>
                ) : (
                  <div className="mx-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {u.adFreeTitle}
                      </span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                        {s.proActive}
                      </span>
                    </div>
                  </div>
                )}
              </Section>
              )}

              {/* ── Subscription Management ──────────────────────── */}
              {isAuthenticated && (profile?.isPro || profile?.isAdFree) && (
                <Section title={s.accountSection || 'Account'} icon={User}>
                  <div className="px-4 py-4">
                    <SubscriptionManager />
                  </div>
                </Section>
              )}

              {/* ── Legal ──────────────────────────────────────────── */}
              <Section title={lang === 'zh' ? '法律資訊' : 'Legal'} icon={ShieldCheck}>
                <Link href="/legal/disclaimer" onClick={onClose}>
                  <Row label={lang === 'zh' ? '免責聲明' : 'Disclaimer'} chevron />
                </Link>
                <Link href="/legal/terms" onClick={onClose}>
                  <Row label={lang === 'zh' ? '使用者條款' : 'Terms of Service'} chevron />
                </Link>
                <Link href="/legal/privacy" onClick={onClose}>
                  <Row label={lang === 'zh' ? '隱私權政策' : 'Privacy Policy'} chevron />
                </Link>
              </Section>

              {/* ── Support ──────────────────────────────────────────── */}
              <DonationBox />

              {/* ── Logout ───────────────────────────────────────────── */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
                    logoutConfirm
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
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

                {/* Delete account — required by App Store guideline 5.1.1(v).
                    Signed-in users only; guests have no server-side account. */}
                {isAuthenticated && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 ${
                        deleteConfirm
                          ? 'bg-red-600 text-white'
                          : 'bg-transparent text-slate-400 hover:text-red-500'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Trash2 size={15} />
                        {deleting
                          ? (lang === 'zh' ? '刪除中…' : 'Deleting…')
                          : deleteConfirm
                            ? (lang === 'zh' ? '確認永久刪除帳號' : 'Confirm permanent deletion')
                            : (lang === 'zh' ? '刪除帳號' : 'Delete account')}
                      </span>
                      {deleteConfirm && (
                        <p className="text-xs font-normal text-white/80 mt-1 px-4 leading-relaxed">
                          {lang === 'zh'
                            ? '此動作無法復原。你的所有數據（InBody 記錄、餐單、訓練、社群發文）都會永久刪除。'
                            : 'This cannot be undone. All your data (InBody records, meal plans, training, posts) will be permanently deleted.'}
                        </p>
                      )}
                    </button>
                    {deleteConfirm && !deleting && (
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="w-full mt-2 text-sm text-slate-400 py-2"
                      >
                        {s.cancel}
                      </button>
                    )}
                  </div>
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
