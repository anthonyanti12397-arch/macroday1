/**
 * AdMob Bridge
 * Real Google AdMob ads for the native (Capacitor) app — rewarded video and
 * banners. Falls back gracefully on web, where AdMob is unavailable: web uses
 * AdSense banners (see components/AdBanner.tsx) and has no true rewarded format.
 *
 * Ad unit ids come from env so the same build can point at test or live units.
 * Defaults are Google's official TEST ad unit ids — safe in development, and
 * they must be replaced with real units (via env) before shipping to the store.
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

// Google's official test ad unit ids (iOS). Documented for developer use.
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313'
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716'

const REWARDED_AD_ID = process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || TEST_REWARDED_IOS
const BANNER_AD_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || TEST_BANNER_IOS

/** True when real AdMob (native) is usable in this runtime. */
export function isAdMobAvailable(): boolean {
  return isNative
}

let initialized = false

/**
 * Initialize AdMob once. On iOS this also requests App Tracking Transparency
 * authorization — required before serving personalized ads on iOS 14+.
 * Requires NSUserTrackingUsageDescription in Info.plist.
 */
export async function initAdMob(): Promise<void> {
  if (!isNative || initialized) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.initialize({ initializeForTesting: false })
    // iOS 14+ App Tracking Transparency: ask once, before serving ads. Declining
    // is fine — ads still serve, just non-personalized (lower eCPM).
    try {
      const { status } = await AdMob.trackingAuthorizationStatus()
      if (status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization()
      }
    } catch {
      // ATT unavailable (e.g. Android or older iOS) — continue without it.
    }
    initialized = true
  } catch (err) {
    console.warn('[AdMob] initialize failed', err)
  }
}

/**
 * Show a rewarded video. Resolves true only when the user actually earned the
 * reward (watched far enough); false if dismissed early or anything failed.
 *
 * This is the core of the ad-supported model: each extra AI generation is paid
 * for by the ad view that unlocks it, so cost can never outrun ad revenue.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!isNative) return false
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await initAdMob()
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID })
    const reward = await AdMob.showRewardVideoAd()
    // A reward item means the user watched enough to earn it.
    return !!reward
  } catch (err) {
    console.warn('[AdMob] rewarded ad failed or dismissed', err)
    return false
  }
}

/** Show a bottom banner. No-op on web (AdSense handles that separately). */
export async function showBannerAd(): Promise<void> {
  if (!isNative) return
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob')
    await initAdMob()
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      // Clear the app's bottom tab bar so the banner never covers navigation.
      margin: 56,
    })
  } catch (err) {
    console.warn('[AdMob] banner failed', err)
  }
}

/** Remove the banner (e.g. when a user turns ads off). */
export async function hideBannerAd(): Promise<void> {
  if (!isNative) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.removeBanner()
  } catch {
    // banner may not be showing — nothing to do
  }
}
