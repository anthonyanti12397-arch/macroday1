'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface TrialCountdownProps {
  trialEndsAt: string | Date | null | undefined
  status?: 'trial' | 'active' | 'canceled'
}

export default function TrialCountdown({ trialEndsAt, status = 'trial' }: TrialCountdownProps) {
  const daysRemaining = useMemo(() => {
    if (!trialEndsAt) return null
    const endDate = new Date(trialEndsAt)
    const now = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }, [trialEndsAt])

  if (status !== 'trial' || daysRemaining === null) {
    return null
  }

  const percentComplete = Math.max(0, 100 - (daysRemaining / 14) * 100)
  const isWarning = daysRemaining <= 3
  const isExpired = daysRemaining === 0
  const isCritical = daysRemaining === 1

  const bgColor = isExpired ? 'bg-red-50' : isWarning ? 'bg-orange-50' : 'bg-blue-50'
  const borderColor = isExpired ? 'border-red-200' : isWarning ? 'border-orange-200' : 'border-blue-200'

  return (
    <motion.div
      className={`w-full space-y-2 sm:space-y-3 rounded-lg ${bgColor} p-3 sm:p-4 border ${borderColor}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title and days remaining */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <h3 className="font-semibold text-blue-900 text-sm sm:text-base">MacroDay Pro Trial</h3>
        <motion.span
          className={`text-xs sm:text-sm font-bold inline-block ${
            isExpired ? 'text-red-600' :
            isCritical ? 'text-red-600' :
            isWarning ? 'text-orange-600' :
            'text-blue-600'
          }`}
          animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
          transition={isWarning ? { duration: 2, repeat: Infinity } : {}}
        >
          {isExpired ? '⏰ Expired' : `⏱️ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
        </motion.span>
      </div>

      {/* Progress bar with animation */}
      <div className="h-2 sm:h-2.5 w-full rounded-full overflow-hidden bg-gray-200">
        <motion.div
          className={`h-full rounded-full transition-all ${
            isExpired ? 'bg-red-500' :
            isCritical ? 'bg-red-500' :
            isWarning ? 'bg-orange-500' :
            'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentComplete)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Warning messages */}
      {isCritical && (
        <motion.div
          className="flex items-start gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-red-700 font-semibold">
            Your trial ends in 1 day! Update your payment method now to avoid service interruption.
          </p>
        </motion.div>
      )}

      {/* Renewal date info */}
      {trialEndsAt && !isExpired && (
        <motion.p
          className={`text-xs sm:text-sm ${
            isWarning ? 'text-orange-700 font-medium' : 'text-blue-700'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Renews on {new Date(trialEndsAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })} for $8.00/month
        </motion.p>
      )}

      {/* Expired message */}
      {isExpired && (
        <motion.p
          className="text-xs sm:text-sm text-red-700 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Your trial has expired. Please renew your subscription to restore access.
        </motion.p>
      )}

      {/* Warning message */}
      {isWarning && !isExpired && !isCritical && (
        <motion.p
          className="text-xs sm:text-sm text-orange-700 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Your trial is ending soon. Ensure your payment method is up to date.
        </motion.p>
      )}
    </motion.div>
  )
}
