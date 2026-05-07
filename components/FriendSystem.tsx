'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Users, Bell, Search, X, Check, Flame, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'

interface FriendUser {
  id: string
  name: string | null
  image: string | null
  email: string | null
  streak: number
  friendshipId?: string
}

interface PendingRequest {
  friendshipId: string
  user: FriendUser
  createdAt: string
}

interface ActivityItem {
  type: 'post' | 'steps'
  user: { id: string; name: string | null; image: string | null }
  createdAt: string
  data: Record<string, unknown>
}

type Tab = 'friends' | 'requests' | 'activity'

function Avatar({ user, size = 10 }: { user: { name: string | null; image: string | null }; size?: number }) {
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  return user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt={user.name ?? ''} className={`w-${size} h-${size} rounded-full object-cover`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold`}>
      {initials}
    </div>
  )
}

export default function FriendSystem() {
  const { lang } = useLang()
  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])
  const [searching, setSearching] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const loadFriends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/friends/list')
      const data = await res.json()
      setFriends(data.friends ?? [])
      setPendingReceived(data.pendingReceived ?? [])
    } catch {
      toast.error(lang === 'zh' ? '載入失敗' : 'Failed to load friends')
    } finally {
      setLoading(false)
    }
  }, [lang])

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/friends/activity')
      const data = await res.json()
      setActivity(data.activity ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadFriends() }, [loadFriends])
  useEffect(() => { if (tab === 'activity') loadActivity() }, [tab, loadActivity])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.users ?? [])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleSendRequest = async (emailOrId?: string) => {
    const target = emailOrId ?? addEmail
    if (!target) return
    setAdding(true)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      toast.success(lang === 'zh' ? '已發送好友申請' : 'Friend request sent!')
      setAddEmail('')
      setShowSearch(false)
      setSearchQuery('')
    } finally {
      setAdding(false)
    }
  }

  const handleRespond = async (friendshipId: string, action: 'accept' | 'decline') => {
    const res = await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    })
    if (res.ok) {
      toast.success(action === 'accept'
        ? (lang === 'zh' ? '已接受' : 'Accepted!')
        : (lang === 'zh' ? '已拒絕' : 'Declined'))
      await loadFriends()
    }
  }

  const handleRemove = async (friendshipId: string) => {
    const res = await fetch('/api/friends/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId }),
    })
    if (res.ok) {
      toast.success(lang === 'zh' ? '已移除好友' : 'Removed')
      await loadFriends()
    }
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'friends', label: lang === 'zh' ? '好友' : 'Friends', badge: friends.length },
    { key: 'requests', label: lang === 'zh' ? '申請' : 'Requests', badge: pendingReceived.length || undefined },
    { key: 'activity', label: lang === 'zh' ? '動態' : 'Activity' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-[#0F9E75]" />
          {lang === 'zh' ? '好友系統' : 'Friends'}
        </h2>
        <button
          onClick={() => setShowSearch(s => !s)}
          className="p-2 rounded-xl bg-[#0F9E75]/10 text-[#0F9E75]"
        >
          <UserPlus size={16} />
        </button>
      </div>

      {/* Add friend panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-3"
          >
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 space-y-2">
              <p className="text-xs text-slate-500">{lang === 'zh' ? '搜尋用戶名或電郵' : 'Search by name or email'}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={lang === 'zh' ? '輸入搜尋...' : 'Type to search...'}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                  />
                </div>
                {searching && <Loader2 size={18} className="animate-spin text-slate-400 self-center" />}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700">
                      <Avatar user={u} size={8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleSendRequest(u.email ?? undefined)}
                        disabled={adding}
                        className="text-xs font-semibold text-[#0F9E75] px-3 py-1 rounded-lg bg-[#0F9E75]/10 shrink-0"
                      >
                        {lang === 'zh' ? '加好友' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct email fallback */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder={lang === 'zh' ? '直接輸入電郵' : 'Or enter email directly'}
                  className="flex-1 px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                />
                <button
                  onClick={() => handleSendRequest()}
                  disabled={adding || !addEmail}
                  className="px-3 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : (lang === 'zh' ? '發送' : 'Send')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex px-4 gap-1 mb-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors relative ${
              tab === t.key
                ? 'bg-[#0F9E75] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <div className="text-center pt-8 text-slate-400 text-sm">
              {lang === 'zh' ? '還沒有好友，搜尋並添加吧！' : 'No friends yet. Add some!'}
            </div>
          ) : (
            friends.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <Avatar user={f} size={10} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{f.name}</p>
                  {f.streak > 0 && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <Flame size={10} /> {f.streak} {lang === 'zh' ? '天連續' : 'day streak'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => f.friendshipId && handleRemove(f.friendshipId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )
        ) : tab === 'requests' ? (
          pendingReceived.length === 0 ? (
            <div className="text-center pt-8 text-slate-400 text-sm">
              {lang === 'zh' ? '沒有待處理申請' : 'No pending requests'}
            </div>
          ) : (
            pendingReceived.map(req => (
              <div key={req.friendshipId} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <Avatar user={req.user} size={10} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{req.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{req.user.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleRespond(req.friendshipId, 'accept')}
                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendshipId, 'decline')}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          // Activity tab
          activity.length === 0 ? (
            <div className="text-center pt-8 text-slate-400 text-sm">
              {lang === 'zh' ? '好友還沒有動態' : 'No friend activity yet'}
            </div>
          ) : (
            activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <Avatar user={item.user} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.user.name}</p>
                  {item.type === 'steps' ? (
                    <p className="text-xs text-slate-500 mt-0.5">
                      👟 {(item.data as { steps: number }).steps.toLocaleString()} {lang === 'zh' ? '步' : 'steps'} · {(item.data as { date: string }).date}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {(item.data as { isCheckIn: boolean }).isCheckIn ? '✅ ' : '💬 '}{(item.data as { content: string }).content}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
