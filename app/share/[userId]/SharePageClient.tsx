'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Share2, Flame, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface PublicUserData {
  userId: string
  name: string
  image: string | null
  streak: number
  weekStart: string | null
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  targetCalories: number
  targetProtein: number
  dayCount: number
  meals: { breakfast?: string; lunch?: string; dinner?: string }[]
}

interface Props {
  data: PublicUserData
}

const macros = (data: PublicUserData) => [
  { label: 'Calories', value: data.avgCalories, unit: 'kcal', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', bar: 'bg-violet-500' },
  { label: 'Protein', value: data.avgProtein, unit: 'g', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' },
  { label: 'Carbs', value: data.avgCarbs, unit: 'g', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500' },
  { label: 'Fat', value: data.avgFat, unit: 'g', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', bar: 'bg-rose-500' },
]

export default function SharePageClient({ data }: Props) {
  const [copied, setCopied] = useState(false)
  const firstName = data.name.split(' ')[0]

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const weekLabel = data.weekStart
    ? new Date(data.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  // Calorie adherence: show ring fill based on avg vs target
  const caloriePercent = data.targetCalories > 0
    ? Math.min(100, Math.round((data.avgCalories / data.targetCalories) * 100))
    : 0

  const handleShare = async () => {
    const text = `Check out ${firstName}'s meal plan on MacroDay! ${data.avgCalories > 0 ? `${data.avgCalories} kcal/day, ${data.avgProtein}g protein` : ''} 💪\n${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `${firstName}'s MacroDay Week`, text, url: shareUrl })
      } catch (_) { /* dismissed */ }
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      toast.error('Could not copy link')
    }
  }

  const items = macros(data)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl">🥗</span>
          <span className="text-violet-400 font-semibold tracking-widest text-sm uppercase">MacroDay</span>
        </div>

        {/* Avatar / initials */}
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-3xl font-bold shadow-lg">
          {data.image
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={data.image} alt={data.name} className="w-full h-full rounded-full object-cover" />
            : firstName[0]?.toUpperCase()}
        </div>

        <h1 className="text-3xl font-bold mb-1">{firstName}&apos;s Week</h1>

        {data.streak > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-3 py-1 text-sm font-semibold mt-2">
            <Flame className="w-4 h-4" />
            {data.streak} day streak
          </div>
        )}

        {weekLabel && (
          <p className="text-gray-500 text-sm mt-3">Week of {weekLabel} • {data.dayCount} days planned</p>
        )}
      </motion.div>

      {/* Macro cards */}
      <motion.div
        className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {items.map((m) => (
          <motion.div
            key={m.label}
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            className={`rounded-2xl border p-4 ${m.bg}`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${m.color} mb-2`}>{m.label}</div>
            <div className="text-3xl font-bold">
              {m.value > 0 ? m.value : '—'}
              <span className="text-base font-normal text-gray-400 ml-1">{m.unit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">avg / day</div>

            {/* Mini progress bar */}
            {m.value > 0 && (
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${m.bar} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (m.value / (m.label === 'Calories' ? 2500 : m.label === 'Protein' ? 180 : m.label === 'Carbs' ? 250 : 80)) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Sample meals */}
      {data.meals.length > 0 && (
        <motion.div
          className="w-full max-w-sm mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">This Week&apos;s Meals</h2>
          <div className="space-y-2">
            {data.meals.map((m, i) => (
              <div key={i} className="bg-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 space-y-1">
                {m.breakfast && <div><span className="text-gray-500">🌅 </span>{m.breakfast}</div>}
                {m.lunch && <div><span className="text-gray-500">☀️ </span>{m.lunch}</div>}
                {m.dinner && <div><span className="text-gray-500">🌙 </span>{m.dinner}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Calorie ring */}
      {caloriePercent > 0 && (
        <motion.div
          className="w-full max-w-sm mb-8 bg-white/5 border border-white/10 rounded-2xl p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Calorie Target</div>
              <div className="text-2xl font-bold">{caloriePercent}% <span className="text-sm font-normal text-gray-400">on track</span></div>
              <div className="text-xs text-gray-600 mt-1">{data.avgCalories} avg / {data.targetCalories} target kcal</div>
            </div>
            <div className="text-4xl">
              {caloriePercent >= 90 ? '🎯' : caloriePercent >= 70 ? '✅' : '📈'}
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${caloriePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
            />
          </div>
        </motion.div>
      )}

      {/* Share button */}
      <motion.button
        onClick={handleShare}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-colors mb-6 w-full max-w-sm justify-center"
      >
        {copied ? <CheckCircle className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        {copied ? 'Copied!' : 'Share this plan'}
      </motion.button>

      {/* CTA to download */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-500 text-sm mb-3">Want your own AI meal plan?</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          🥗 Try MacroDay free
        </Link>
      </motion.div>
    </div>
  )
}
