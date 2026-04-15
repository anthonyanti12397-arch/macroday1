'use client'

import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LangProvider, useLang } from '@/contexts/LangContext'
import AuthGate from '@/components/AuthGate'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import BottomNav from '@/components/BottomNav'
import { checkAndInitStarterGear } from '@/lib/storage'
import { GEAR_DB } from '@/lib/outfits'

function ClientSideInit() {
  const { lang } = useLang()
  
  useEffect(() => {
    // 1. Check/Grant Starter Gear
    const grantedIds = checkAndInitStarterGear(GEAR_DB)
    if (grantedIds && grantedIds.length > 0) {
      const names = grantedIds.map(id => {
        const item = GEAR_DB.find(p => p.id === id)
        return lang === 'zh' ? item?.nameZh : item?.nameEn
      }).join(', ')
      
      toast.success(
        lang === 'zh' 
          ? `送你 2 件驚喜裝備！已加入衣櫃：${names}` 
          : `Gifting 2 surprise items! Added to wardrobe: ${names}`,
        { duration: 6000, icon: '🎁' }
      )
    }
  }, [lang])

  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthGate>
          <ClientSideInit />
          <main className="pb-24 max-w-2xl mx-auto px-4 pt-safe">
            {children}
          </main>
          <BottomNav />
          <Toaster position="top-center" richColors />
          <PWAInstallPrompt />
          <Analytics />
          <SpeedInsights />
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3028542923682031"
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        </AuthGate>
      </LangProvider>
    </ThemeProvider>
  )
}
