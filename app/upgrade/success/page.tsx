'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import confetti from 'canvas-confetti'
import { saveUserProfile, getUserProfile } from '@/lib/storage'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UpgradeSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    const profile = getUserProfile()
    if (profile) {
      saveUserProfile({ ...profile, isPro: true })
    }

    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(async (res) => {
          if (res.ok) {
            await update() // Force JWT refresh so isPro shows immediately
          }
          setConfirmed(true)
        })
        .catch(() => setConfirmed(true))
    } else {
      setConfirmed(true)
    }

    return () => clearInterval(interval)
  }, [searchParams, update])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white/50 backdrop-blur-sm rounded-3xl mt-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 bg-[#0F9E75]/10 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle className="text-[#0F9E75]" size={40} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black text-slate-800 tracking-tight mb-2"
      >
        MacroDay Pro is live
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-slate-500 mb-8"
      >
        {confirmed
          ? 'Your 14-day Pro trial is active and your account has been updated.'
          : 'Finalizing your Pro access...'}
      </motion.p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/pricing')}
        className="btn-primary px-8 py-4 gap-2 text-base rounded-2xl shadow-xl shadow-[#0F9E75]/20"
      >
        See Pro benefits <ArrowRight size={18} />
      </motion.button>
    </div>
  )
}
