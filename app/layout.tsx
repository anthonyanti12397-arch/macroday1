import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP_NAME } from '@/lib/constants'
import BottomNav from '@/components/BottomNav'
import AuthGate from '@/components/AuthGate'
import { LangProvider } from '@/contexts/LangContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'sonner'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#0F9E75',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'MacroDay · AI 每日營養教練',
  description: 'AI 驅動的一站式營養管理與餐單規劃。輕鬆計算 TDEE，三餐 AI 自動匹配你的增肌減脂目標。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'MacroDay · AI 每日營養教練',
    description: 'AI 驅動的一站式營養管理與餐單規劃。',
    images: ['/api/pwa-icon?size=512'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased`}>
        <ThemeProvider>
        <LangProvider>
          <AuthGate>
            <main className="pb-24 max-w-2xl mx-auto px-4 pt-safe">
              {children}
            </main>
            <BottomNav />
            <Toaster position="top-center" richColors />
            <PWAInstallPrompt />
          </AuthGate>
        </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
