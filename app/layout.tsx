import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { APP_NAME, ADSENSE_CLIENT_ID } from '@/lib/constants'
import Providers from '@/components/Providers'
import ClientSideInit from '@/components/ClientSideInit'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

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
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  other: {
    'google-adsense-account': 'ca-pub-3028542923682031',
  },
  openGraph: {
    title: 'MacroDay · AI 每日營養教練',
    description: 'AI 驅動的一站式營養管理與餐單規劃。',
    images: ['/api/pwa-icon?size=512'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${inter.className} min-h-screen antialiased`}>
        {ADSENSE_CLIENT_ID && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          />
        )}
        <Providers>
          <ClientSideInit />
          {children}
        </Providers>
      </body>
    </html>
  )
}
