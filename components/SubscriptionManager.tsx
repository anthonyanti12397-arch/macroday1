'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import TrialCountdown from './TrialCountdown'
import BillingHistory from './BillingHistory'

interface SubscriptionStatus {
  status: 'free' | 'trial' | 'active' | 'canceled' | 'past_due'
  plan: 'free' | 'pro' | 'adfree'
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  canceledAt: string | null
  nextPaymentAttempt: string | null
}

export default function SubscriptionManager() {
  const { data: session, update } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changing, setChanging] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'adfree' | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/subscriptions/status')
      if (!res.ok) throw new Error('Failed to fetch subscription status')
      const data = await res.json()
      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (newPlan: 'pro' | 'adfree') => {
    const toastId = toast.loading('Updating your plan...')
    try {
      setChanging(true)
      setError(null)
      setSelectedPlan(newPlan)

      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to change plan')
      }

      // Refresh subscription status and session
      await fetchSubscriptionStatus()
      await update()

      const planName = newPlan === 'pro' ? 'MacroDay Pro' : 'Ad-Free'
      toast.success(`Plan updated to ${planName}!`, {
        id: toastId,
        description: 'Prorations will be applied to your next invoice.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change plan'
      setError(message)
      toast.error('Failed to update plan', {
        id: toastId,
        description: message,
      })
    } finally {
      setChanging(false)
      setSelectedPlan(null)
    }
  }

  const handleCancelSubscription = async () => {
    const toastId = toast.loading('Canceling subscription...')
    try {
      setCanceling(true)
      setError(null)
      setShowCancelConfirm(false)

      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      const data = await res.json()

      // Refresh subscription status and session
      await fetchSubscriptionStatus()
      await update()

      toast.success('Subscription canceled', {
        id: toastId,
        description: `Access continues until ${new Date(data.lastChargeDate).toLocaleDateString()}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription'
      setError(message)
      toast.error('Failed to cancel subscription', {
        id: toastId,
        description: message,
      })
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader className="text-slate-400" size={32} />
        </motion.div>
      </motion.div>
    )
  }

  if (!subscription) {
    return (
      <motion.div
        className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-700 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Failed to load subscription information
      </motion.div>
    )
  }

  const currentPlanName = subscription.plan === 'pro' ? 'MacroDay Pro' :
                          subscription.plan === 'adfree' ? 'Ad-Free' :
                          'Free'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan status */}
      <motion.div
        className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Current Plan</h3>
            <p className="text-sm text-slate-600 mt-1">{currentPlanName}</p>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {subscription.status === 'active' && (
              <div className="flex items-center gap-2 text-green-600 px-3 py-1 rounded-full bg-green-50">
                <CheckCircle size={18} />
                <span className="text-xs sm:text-sm font-medium">Active</span>
              </div>
            )}
            {subscription.status === 'trial' && (
              <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                Trial Active
              </div>
            )}
            {subscription.status === 'canceled' && (
              <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                Canceling
              </div>
            )}
          </motion.div>
        </div>

        {/* Trial countdown */}
        {subscription.status === 'trial' && subscription.trialEndsAt && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <TrialCountdown trialEndsAt={subscription.trialEndsAt} status="trial" />
          </motion.div>
        )}

        {/* Billing period info */}
        {subscription.currentPeriodEnd && (
          <motion.p
            className="text-xs sm:text-sm text-slate-600 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </motion.p>
        )}

        {subscription.status === 'canceled' && subscription.canceledAt && (
          <motion.p
            className="text-xs sm:text-sm text-orange-700 mt-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Subscription will end on {new Date(subscription.canceledAt).toLocaleDateString()}
          </motion.p>
        )}
      </motion.div>

      {/* Plan options */}
      {subscription.plan !== 'free' && subscription.status !== 'canceled' && (
        <motion.div
          className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="font-semibold text-slate-900 mb-4">Switch Plan</h3>
          <div className="grid gap-2 sm:gap-3">
            {subscription.plan !== 'pro' && (
              <motion.button
                onClick={() => handleChangePlan('pro')}
                disabled={changing || selectedPlan === 'pro'}
                className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">MacroDay Pro</p>
                  <p className="text-xs sm:text-sm text-slate-600">$8.00/month</p>
                </div>
                {changing && selectedPlan === 'pro' ? (
                  <Loader className="animate-spin text-blue-600 flex-shrink-0" size={20} />
                ) : (
                  <ArrowRight className="text-blue-600 flex-shrink-0" size={20} />
                )}
              </motion.button>
            )}

            {subscription.plan !== 'adfree' && (
              <motion.button
                onClick={() => handleChangePlan('adfree')}
                disabled={changing || selectedPlan === 'adfree'}
                className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900 text-sm sm:text-base">Ad-Free</p>
                  <p className="text-xs sm:text-sm text-slate-600">$8.00/month</p>
                </div>
                {changing && selectedPlan === 'adfree' ? (
                  <Loader className="animate-spin text-blue-600 flex-shrink-0" size={20} />
                ) : (
                  <ArrowRight className="text-blue-600 flex-shrink-0" size={20} />
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Billing history */}
      <motion.div
        className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="font-semibold text-slate-900 mb-4">Billing History</h3>
        <BillingHistory compact={false} />
      </motion.div>

      {/* Cancel subscription */}
      {subscription.plan !== 'free' && subscription.status !== 'canceled' && (
        <motion.div
          className="rounded-lg border border-orange-200 bg-orange-50 p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="font-semibold text-orange-900 mb-2">Cancel Subscription</h3>
          <p className="text-xs sm:text-sm text-orange-700 mb-4">
            You can cancel anytime. Your access will continue until the end of your billing period.
          </p>

          <AnimatePresence mode="wait">
            {!showCancelConfirm ? (
              <motion.button
                key="cancel-btn"
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 sm:px-4 py-2 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition font-medium text-xs sm:text-sm active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Cancel Subscription
              </motion.button>
            ) : (
              <motion.div
                key="confirm-prompt"
                className="space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-xs sm:text-sm font-medium text-orange-900">
                  ⚠️ Are you sure? You&apos;ll lose premium features.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <motion.button
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-2 sm:order-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {canceling && <Loader className="animate-spin" size={16} />}
                    {canceling ? 'Canceling...' : 'Confirm'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={canceling}
                    className="px-3 sm:px-4 py-2 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition font-medium text-xs sm:text-sm disabled:opacity-50 order-1 sm:order-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Never mind
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
