'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Footprints, Trophy, TrendingUp, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'

interface StepLog {
  id: string
  date: string
  steps: number
  source: string
}

interface Stats {
  total: number
  avg: number
  best: number
  days: number
}

interface LeaderboardEntry {
  rank: number
  user: { id: string; name: string | null; image: string | null }
  steps: number
  isMe: boolean
}

const DAILY_GOAL = 10000

function Avatar({ user, size = 8 }: { user: { name: string | null; image: string | null }; size?: number }) {
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

export default function StepTracker() {
  const { lang } = useLang()
  const [logs, setLogs] = useState<StepLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inputSteps, setInputSteps] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'tracker' | 'leaderboard'>('tracker')

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs.find(l => l.date === today)
  const todaySteps = todayLog?.steps ?? 0
  const progress = Math.min(100, Math.round((todaySteps / DAILY_GOAL) * 100))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [histRes, lbRes] = await Promise.all([
        fetch('/api/steps/history?days=7'),
        fetch('/api/steps/leaderboard'),
      ])
      const histData = await histRes.json()
      const lbData = await lbRes.json()
      setLogs(histData.logs ?? [])
      setStats(histData.stats ?? null)
      setLeaderboard(lbData.leaderboard ?? [])
    } catch {
      toast.error(lang === 'zh' ? '載入失敗' : 'Failed to load steps')
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => { load() }, [load])

  const handleLog = async () => {
    const steps = parseInt(inputSteps, 10)
    if (isNaN(steps) || steps < 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/steps/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, steps, source: 'manual' }),
      })
      if (!res.ok) { toast.error('Failed'); return }
      toast.success(lang === 'zh' ? `記錄了 ${steps.toLocaleString()} 步！` : `Logged ${steps.toLocaleString()} steps!`)
      setInputSteps('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  const ringDash = 2 * Math.PI * 44 // circumference for r=44
  const ringOffset = ringDash * (1 - progress / 100)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Footprints size={18} className="text-[#0F9E75]" />
          {lang === 'zh' ? '步數追蹤' : 'Step Tracker'}
        </h2>
        <div className="flex gap-1">
          {(['tracker', 'leaderboard'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors ${
                tab === t ? 'bg-[#0F9E75] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {t === 'tracker' ? (lang === 'zh' ? '記錄' : 'Track') : (lang === 'zh' ? '排行' : 'Rank')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : tab === 'tracker' ? (
        <div className="px-4 pb-4 space-y-4">
          {/* Ring + today steps */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
                <motion.circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#0F9E75"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringDash}
                  initial={{ strokeDashoffset: ringDash }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-800 dark:text-white leading-none">
                  {(todaySteps / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] text-slate-400">{lang === 'zh' ? '今日' : 'today'}</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'zh' ? `目標: ${DAILY_GOAL.toLocaleString()} 步` : `Goal: ${DAILY_GOAL.toLocaleString()} steps`}
              </p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                {progress}%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {todaySteps > 0
                  ? (lang === 'zh' ? `還差 ${Math.max(0, DAILY_GOAL - todaySteps).toLocaleString()} 步` : `${Math.max(0, DAILY_GOAL - todaySteps).toLocaleString()} to go`)
                  : (lang === 'zh' ? '今天還沒記錄' : 'Nothing logged yet')
                }
              </p>
            </div>
          </div>

          {/* Log steps input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="99999"
              value={inputSteps}
              onChange={e => setInputSteps(e.target.value)}
              placeholder={lang === 'zh' ? '輸入步數...' : 'Enter steps...'}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:border-[#0F9E75]"
              onKeyDown={e => e.key === 'Enter' && handleLog()}
            />
            <button
              onClick={handleLog}
              disabled={saving || !inputSteps}
              className="px-4 py-3 rounded-2xl text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)' }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {lang === 'zh' ? '記錄' : 'Log'}
            </button>
          </div>

          {/* Weekly stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <TrendingUp size={14} />, label: lang === 'zh' ? '平均' : 'Avg', value: stats.avg.toLocaleString(), color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' },
                { icon: <Trophy size={14} />, label: lang === 'zh' ? '最高' : 'Best', value: stats.best.toLocaleString(), color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
                { icon: <Footprints size={14} />, label: lang === 'zh' ? '7天總計' : '7d total', value: (stats.total / 1000).toFixed(0) + 'k', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 ${s.color.split(' ').slice(1).join(' ')}`}>
                  <div className={`${s.color.split(' ')[0]} mb-1`}>{s.icon}</div>
                  <div className="text-lg font-black text-slate-800 dark:text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent logs */}
          {logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'zh' ? '最近 7 天' : 'Last 7 days'}</p>
              {logs.map(log => {
                const pct = Math.min(100, Math.round((log.steps / DAILY_GOAL) * 100))
                return (
                  <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="text-xs text-slate-500 w-16 shrink-0">{log.date.slice(5)}</div>
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0F9E75] to-[#0BD68A]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 w-16 text-right shrink-0">
                      {log.steps.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        // Leaderboard tab
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-slate-400">{lang === 'zh' ? '本週好友步數排行' : 'This week — you & friends'}</p>
          {leaderboard.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              {lang === 'zh' ? '添加好友後可見排行榜' : 'Add friends to see the leaderboard'}
            </p>
          ) : (
            leaderboard.map(entry => (
              <div
                key={entry.user.id}
                className={`flex items-center gap-3 p-3 rounded-2xl ${
                  entry.isMe
                    ? 'bg-[#0F9E75]/10 border border-[#0F9E75]/30'
                    : 'bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <span className="text-sm font-black w-5 text-center text-slate-500">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </span>
                <Avatar user={entry.user} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {entry.isMe ? (lang === 'zh' ? '我' : 'Me') : entry.user.name}
                  </p>
                </div>
                <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {entry.steps > 0 ? entry.steps.toLocaleString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
