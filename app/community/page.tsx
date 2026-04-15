'use client'

import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { ArrowRight, Lock, MessageSquare, Trophy, Users } from 'lucide-react'
import AdBanner from '@/components/AdBanner'

export default function CommunityPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F9E75] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="py-10 space-y-6">
        <div className="card-lg p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F5F0] flex items-center justify-center mx-auto">
            <Lock size={24} className="text-[#0F9E75]" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Sign in to join MacroDay Community</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Posting and replies are tied to a real account so your progress can sync.</p>
          </div>
          <button
            onClick={() => signIn('google', { callbackUrl: '/community' })}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0F9E75, #0BD68A)' }}
          >
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
          <Users size={18} className="text-[#0F9E75]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Community</h1>
          <p className="text-xs text-slate-400">Forum-first social features are now live.</p>
        </div>
      </div>

      {[
        { icon: MessageSquare, title: 'Forum', desc: 'Share meals, get replies, and keep streak momentum moving.', href: '/community/forum' },
        { icon: Trophy, title: 'Leaderboards', desc: 'Next up after the forum foundation is fully in place.', href: '/pricing' },
      ].map(({ icon: Icon, title, desc, href }) => (
        <Link key={title} href={href} className="card-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F5F0] flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#0F9E75]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
          </div>
          <ArrowRight size={16} className="text-slate-300" />
        </Link>
      ))}

      <AdBanner />
    </div>
  )
}
