'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import {
  isPushSupported, getPushPermission, requestPushPermission,
  dismissPushBanner, isPushBannerDismissed,
} from '@/lib/push'
import { useLang } from '@/contexts/LangContext'

export default function PushPermissionBanner() {
  const { lang } = useLang()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    if (isPushBannerDismissed()) return
    if (getPushPermission() !== 'default') return
    // Show banner after a short delay to avoid jarring on page load
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [])

  async function handleEnable() {
    const result = await requestPushPermission()
    if (result === 'granted') {
      // Send a welcome notification
      try {
        new Notification(
          lang === 'zh' ? 'MacroDay 提醒已開啟 🎉' : 'MacroDay notifications enabled 🎉',
          {
            body: lang === 'zh' ? '我們會在用餐時間提醒你記錄飲食！' : "We'll remind you to log meals at meal times!",
            icon: '/api/pwa-icon?size=192',
          }
        )
      } catch { /* ignore */ }
    }
    setShow(false)
    dismissPushBanner()
  }

  function handleDismiss() {
    setShow(false)
    dismissPushBanner()
  }

  if (!show) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3.5 border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--card-shadow-sm)' }}>
      <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] flex items-center justify-center shrink-0">
        <Bell size={16} className="text-[#0F9E75]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
          {lang === 'zh' ? '開啟飲食提醒？' : 'Enable meal reminders?'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {lang === 'zh' ? '每天提醒你記錄早午晚三餐，養成習慣' : 'Get reminded to log breakfast, lunch & dinner daily'}
        </p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleEnable}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
          >
            {lang === 'zh' ? '開啟通知' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}
          >
            {lang === 'zh' ? '不用了' : 'Not now'}
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
        <X size={14} />
      </button>
    </div>
  )
}
