'use client'

import Image from 'next/image'
import { useLang } from '@/contexts/LangContext'

export interface NativeAdData {
  brand: string
  tagline: string
  taglineZh: string
  cta: string
  ctaZh: string
  ctaUrl: string
  imageUrl: string
  accentColor?: string
}

// ── Placeholder ad — swap this out with real ad data ──────────────────────────
const AD: NativeAdData = {
  brand: 'MyProtein',
  tagline: 'Premium whey protein, science-backed nutrition.',
  taglineZh: '高品質乳清蛋白，科學配方助你增肌。',
  cta: 'Shop Now',
  ctaZh: '立即選購',
  ctaUrl: 'https://www.myprotein.com',
  imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
  accentColor: '#0F9E75',
}

export default function NativeAd({ ad = AD }: { ad?: NativeAdData }) {
  const { lang } = useLang()

  return (
    <a
      href={ad.ctaUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-3.5 p-3.5 bg-white">
        {/* Ad image */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
          <Image
            src={ad.imageUrl}
            alt={ad.brand}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Ad copy */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs font-bold text-slate-800 truncate">{ad.brand}</p>
            <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1 py-0.5 rounded shrink-0">
              AD
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-snug line-clamp-2">
            {lang === 'zh' ? ad.taglineZh : ad.tagline}
          </p>
        </div>

        {/* CTA */}
        <div
          className="shrink-0 text-[11px] font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: ad.accentColor ?? '#0F9E75' }}
        >
          {lang === 'zh' ? ad.ctaZh : ad.cta}
        </div>
      </div>
    </a>
  )
}
