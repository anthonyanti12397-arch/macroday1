'use client'

import { useEffect, useRef } from 'react'
import { useLang } from '@/contexts/LangContext'
import { getUserProfile } from '@/lib/storage'
import { shouldShowBannerAds } from '@/lib/featureGate'
import { ADSENSE_CLIENT_ID, ADSENSE_SLOT_BANNER } from '@/lib/constants'

// Renders a real Google AdSense banner when an ad-unit slot is configured
// (NEXT_PUBLIC_ADSENSE_SLOT_BANNER). Until then it shows a dev placeholder so
// the layout is intact. Hidden entirely for Pro / ad-free users.
export default function AdBanner() {
  const { lang } = useLang()
  const profile = getUserProfile()
  const pushedRef = useRef(false)

  const showAds = shouldShowBannerAds({
    isPro: profile?.isPro,
    hasAdFree: profile?.isAdFree,
  })

  const adsEnabled = !!ADSENSE_CLIENT_ID && !!ADSENSE_SLOT_BANNER

  useEffect(() => {
    if (!showAds || !adsEnabled || pushedRef.current) return
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushedRef.current = true
    } catch {
      // AdSense script not loaded yet / blocked — placeholder stays.
    }
  }, [showAds, adsEnabled])

  if (!showAds) return null

  // Real ad unit
  if (adsEnabled) {
    return (
      <div className="w-full my-4 overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT_BANNER}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  // Dev placeholder (no slot configured yet)
  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] text-center my-4 overflow-hidden relative">
      <div className="absolute top-2 right-3 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 rounded uppercase tracking-wider">
        Ad
      </div>
      <p className="text-zinc-400 font-semibold text-sm">
        {lang === 'zh' ? '贊助商廣告' : 'Sponsored'}
      </p>
      <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">
        {lang === 'zh' ? '(設定 AdSense 版位後顯示)' : '(shows once AdSense slot is set)'}
      </p>
    </div>
  )
}
