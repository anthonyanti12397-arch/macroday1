import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP_NAME } from '@/lib/constants'
import BottomNav from '@/components/BottomNav'
import AuthGate from '@/components/AuthGate'
import { LangProvider } from '@/contexts/LangContext'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#0F9E75',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'AI-powered daily nutrition coach',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <LangProvider>
          <AuthGate>
            <main className="pb-20 max-w-2xl mx-auto px-4">
              {children}
            </main>
            <BottomNav />
          </AuthGate>
        </LangProvider>
      </body>
    </html>
  )
}
