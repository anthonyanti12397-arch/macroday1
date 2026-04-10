'use client'

/**
 * Community page — protected route (requires real account, not guest).
 * Middleware at /middleware.ts redirects unauthenticated users to sign-in.
 * Guest users who bypass middleware see the "sign in required" prompt below.
 */

import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { Users, Lock, MessageSquare, Trophy, TrendingUp } from 'lucide-react'
import Image from 'next/image'

export default function CommunityPage() {
  const { data: session, status } = useSession()

  // Should be caught by middleware, but guard here too for guest users
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
            <p className="text-lg font-bold text-slate-800 mb-2">登入以使用社區功能</p>
            <p className="text-sm text-slate-500">社區功能需要實名帳號，訪客模式不適用</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/community' })}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0F9E75, #0BD68A)', boxShadow: '0 4px 16px rgba(15,158,117,0.3)' }}
            >
              以 Google 登入
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-500 border border-slate-200"
            >
              以 Email 登入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
          <Users size={18} className="text-[#0F9E75]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Gym 社區</h1>
          <p className="text-xs text-slate-400">與健身夥伴分享進度</p>
        </div>
      </div>

      {/* User identity card */}
      <div className="card-lg p-4 flex items-center gap-3">
        {session.user.image ? (
          <Image src={session.user.image} alt="avatar" width={44} height={44} className="rounded-2xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-[#E8F5F0] flex items-center justify-center">
            <span className="text-lg font-black text-[#0F9E75]">
              {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">
            {session.user.name ?? session.user.email}
          </p>
          <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#E8F5F0] text-[#0F9E75]">
          {session.user.provider === 'google' ? 'Google' : 'Email'}
        </span>
      </div>

      {/* Coming soon features */}
      {[
        { icon: MessageSquare, title: '飲食打卡', desc: '分享今日三餐，獲得點讚與留言', tag: '即將推出' },
        { icon: Trophy,        title: '排行榜',   desc: '每週蛋白質達成率排名，看看誰最努力', tag: '即將推出' },
        { icon: TrendingUp,    title: '進度分享', desc: '分享體重/體脂變化，互相鼓勵',       tag: '即將推出' },
      ].map(({ icon: Icon, title, desc, tag }) => (
        <div key={title} className="card-lg p-5 flex items-start gap-4 opacity-70">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-slate-700 text-sm">{title}</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">{tag}</span>
            </div>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
