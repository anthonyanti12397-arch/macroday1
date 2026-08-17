'use client'

import { useEffect } from 'react'
import { useCloudSync } from '@/hooks/useCloudSync'
import { isAdMobAvailable, initAdMob, showBannerAd } from '@/lib/admob'
import { getUserProfile } from '@/lib/storage'
import { shouldShowBannerAds } from '@/lib/featureGate'

export default function ClientSideInit() {
  useCloudSync()

  // Native app: initialize AdMob and show the persistent banner. Ads fund the
  // free tier, so this runs for everyone except ad-free/Pro users.
  useEffect(() => {
    if (!isAdMobAvailable()) return
    const profile = getUserProfile()
    if (!shouldShowBannerAds({ isPro: profile?.isPro, hasAdFree: profile?.isAdFree })) return

    let cancelled = false
    ;(async () => {
      await initAdMob()
      if (!cancelled) await showBannerAd()
    })()

    return () => { cancelled = true }
  }, [])

  return null
}
