'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { useGuestSession } from '@/hooks/useGuestSession'
import LoginScreen from './LoginScreen'
import LoadingScreen from './LoadingScreen'
import {
  getUserProfile, saveUserProfile,
  getInBodyHistory, getLatestWeeklyPlan, getTodayDailyMeals,
  hasCompletedMigration, markMigrationComplete,
} from '@/lib/storage'

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { isGuest, loginAsGuest, logoutGuest, isHydrated } = useGuestSession()
  const hasSynced = useRef(false)

  // Sync isPro/isAdFree from session → local profile
  useEffect(() => {
    if (status !== 'authenticated') return
    const profile = getUserProfile()
    if (profile) {
      const needsUpdate =
        profile.isPro !== session?.user?.isPro ||
        (profile as any).isAdFree !== session?.user?.isAdFree
      if (needsUpdate) {
        saveUserProfile({ ...profile, isPro: !!session?.user?.isPro, isAdFree: !!session?.user?.isAdFree } as any)
      }
    }
  }, [session?.user?.isPro, session?.user?.isAdFree, status])

  // On first login: sync local data to server then clear guest session
  useEffect(() => {
    if (status !== 'authenticated' || hasSynced.current) return
    if (hasCompletedMigration()) {
      hasSynced.current = true
      return
    }
    hasSynced.current = true

    const inbodyHistory = getInBodyHistory()
    const profile = getUserProfile()
    const weeklyPlan = getLatestWeeklyPlan()
    const dailyMeals = getTodayDailyMeals()

    // Only sync if there's local data worth saving
    if (inbodyHistory.length > 0 || profile || weeklyPlan || dailyMeals) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inbodyHistory,
          profile,
          weeklyPlan,
          dailyMeals,
          currentStreak: 0,
        }),
      })
        .then(() => markMigrationComplete())
        .catch(() => {}) // silent — will retry next login
    } else {
      markMigrationComplete()
    }

    // Clear guest session now that we have a real account
    if (isGuest) logoutGuest()
  }, [status, isGuest, logoutGuest])

  // 1. Wait for hydration (reading localStorage) and NextAuth status
  if (!isHydrated || status === 'loading') {
    return <LoadingScreen />
  }

  // 2. Either authenticated via Google OR Guest session from localStorage exists
  const isLoggedIn = !!session || isGuest

  if (!isLoggedIn) {
    // Note: LoginScreen might need update to handle loginAsGuest
    return (
      <LoginScreen onLogin={(data) => {
        if (data?.isGuest) {
          loginAsGuest(data)
        }
        // Force refresh or state update is handled by the component internal logic
      }} />
    )
  }

  // 3. User is authorized
  return <>{children}</>
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </SessionProvider>
  )
}
