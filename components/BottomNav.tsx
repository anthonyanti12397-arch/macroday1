'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, UtensilsCrossed, ShoppingCart, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/contexts/LangContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLang()

  const tabs = [
    { href: '/',           label: t.nav.home,   icon: Home },
    { href: '/inbody',     label: t.nav.inbody, icon: Activity },
    { href: '/training',   label: t.nav.training, icon: Dumbbell },
    { href: '/meal-plan',  label: t.nav.meals,  icon: UtensilsCrossed },
    { href: '/shopping',   label: t.nav.shop,   icon: ShoppingCart },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] tab-safe-bottom isolate"
      style={{ background: 'var(--bg-card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid var(--border-card)' } as React.CSSProperties}>
      <div className="max-w-2xl mx-auto flex px-1 pointer-events-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 relative cursor-pointer touch-manipulation select-none"
            >
              <div className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200',
                active ? 'dark:bg-[#0F9E75]/15 bg-[#E8F5F0]' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-[#0F9E75]' : 'text-slate-400 dark:text-slate-500'}
                />
                <span className={cn(
                  'text-[10px] font-bold tracking-wide transition-colors',
                  active ? 'text-[#0F9E75]' : 'text-slate-400 dark:text-slate-500'
                )}>
                  {label}
                </span>
              </div>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #0F9E75, #0BD68A)' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
