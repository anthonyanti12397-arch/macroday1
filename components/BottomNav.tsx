'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, UtensilsCrossed, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/contexts/LangContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLang()

  const tabs = [
    { href: '/',           label: t.nav.home,   icon: Home },
    { href: '/inbody',     label: t.nav.inbody, icon: Activity },
    { href: '/meal-plan',  label: t.nav.meals,  icon: UtensilsCrossed },
    { href: '/shopping',   label: t.nav.shop,   icon: ShoppingCart },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 tab-safe-bottom"
      style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-card)' } as React.CSSProperties}>
      <div className="max-w-2xl mx-auto flex px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
            >
              <div className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-200',
                active ? 'bg-[#E8F5F0]' : ''
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-[#0F9E75]' : 'text-slate-400'}
                />
                <span className={cn(
                  'text-[10px] font-semibold tracking-wide transition-colors',
                  active ? 'text-[#0F9E75]' : 'text-slate-400'
                )}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
