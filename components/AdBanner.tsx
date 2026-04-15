'use client'

import { useLang } from '@/contexts/LangContext'
import { getUserProfile } from '@/lib/storage'
import { shouldShowBannerAds } from '@/lib/featureGate'

// Dummy component that acts as a placeholder for a Google AdSense banner or similar network.
export default function AdBanner() {
  const { lang } = useLang()
  const profile = getUserProfile()
  
  const showAds = shouldShowBannerAds({
    isPro: profile?.isPro,
    hasAdFree: profile?.isAdFree
  })

  if (!showAds) return null

  return (
    <div className="w-full bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] text-center my-4 overflow-hidden relative group">
      <div className="absolute top-2 right-3 px-1.5 py-0.5 bg-zinc-200 text-[9px] font-bold text-zinc-500 rounded uppercase tracking-wider">
        Ad
      </div>
      <p className="text-zinc-400 font-semibold text-sm">
        {lang === 'zh' ? '贊助商廣告' : 'Sponsored Content'}
      </p>
      <p className="text-zinc-300 text-xs mt-1">
        {lang === 'zh' ? '(Google AdSense 預留版位)' : '(Google AdSense Placeholder)'}
      </p>
      {/* Real AdSense tag goes here when approved:
         <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-xxx"
              data-ad-slot="xxx"
              data-ad-format="auto"
              data-full-width-responsive="true"></ins> 
      */}
    </div>
  )
}
