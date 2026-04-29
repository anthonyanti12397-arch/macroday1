'use client'

import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LangProvider, useLang } from '@/contexts/LangContext'
import AuthGate from '@/components/AuthGate'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import BottomNav from '@/components/BottomNav'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthGate>
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
