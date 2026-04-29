'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  getInBodyHistory, replaceInBodyHistory,
  getUserProfile, replaceUserProfile,
  getTodayDailyMeals, replaceDailyMeals,
  getLatestWeeklyPlan, replaceWeeklyPlan,
  getTrainingHistory, replaceTrainingHistory,
  getFavorites, replaceFavorites,
  getLang, saveLang,
  getCloudAppState,
} from '@/lib/storage'
import type { CloudSnapshot, MigrationPayload } from '@/lib/types'

function mergeSnapshot(cloud: CloudSnapshot): MigrationPayload {
  // InBody: union by ID, sorted by date
  const localInBody = getInBodyHistory()
  const cloudIds = new Set(cloud.inbodyHistory.map(r => r.id))
  const mergedInBody = [
    ...cloud.inbodyHistory,
    ...localInBody.filter(r => !cloudIds.has(r.id)),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Profile: cloud wins (has isPro / isAdFree from server); fall back to local
  const localProfile = getUserProfile()
  const mergedProfile = cloud.profile ?? localProfile

  // Daily meals: keep local if it's today, otherwise use cloud
  const localMeals = getTodayDailyMeals()
  const mergedMeals = localMeals ?? cloud.dailyMeals

  // Weekly plan: cloud wins
  const mergedWeekly = cloud.weeklyPlan ?? getLatestWeeklyPlan()

  // Training history: union by date (local wins for same date)
  const localTraining = getTrainingHistory()
  const localDates = new Set(localTraining.map(r => r.date))
  const mergedTraining = [
    ...localTraining,
    ...cloud.appState.trainingHistory.filter(r => !localDates.has(r.date)),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 90)

  // Favorites: union by meal name
  const localFavs = getFavorites()
  const localFavNames = new Set(localFavs.map(f => f.name))
  const mergedFavs = [
    ...localFavs,
    ...cloud.appState.favorites.filter(f => !localFavNames.has(f.name)),
  ]

  // Lang: local wins (user's current preference)
  const mergedLang = getLang()

  return {
    inbodyHistory: mergedInBody,
    profile: mergedProfile,
    dailyMeals: mergedMeals,
    weeklyPlan: mergedWeekly,
    currentStreak: Math.max(0, cloud.currentStreak ?? 0),
    appState: {
      trainingHistory: mergedTraining,
      favorites: mergedFavs,
      lang: mergedLang,
    },
  }
}

function applyMerged(merged: MigrationPayload): void {
  replaceInBodyHistory(merged.inbodyHistory)
  replaceUserProfile(merged.profile)
  replaceDailyMeals(merged.dailyMeals)
  replaceWeeklyPlan(merged.weeklyPlan)
  replaceTrainingHistory(merged.appState?.trainingHistory ?? [])
  replaceFavorites(merged.appState?.favorites ?? [])
  saveLang(merged.appState?.lang ?? 'zh')
}

export function useCloudSync() {
  const { data: session, status } = useSession()
  const syncedRef = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    // Only sync once per browser session
    const sessionKey = `macroday_synced_${session.user.id}`
    if (sessionStorage.getItem(sessionKey)) return
    if (syncedRef.current) return
    syncedRef.current = true

    async function sync() {
      try {
        // 1. Fetch cloud snapshot
        const res = await fetch('/api/user/sync')
        if (!res.ok) throw new Error('fetch failed')
        const cloud: CloudSnapshot | null = await res.json()

        // 2. Merge cloud + local
        const merged = cloud ? mergeSnapshot(cloud) : {
          inbodyHistory: getInBodyHistory(),
          profile: getUserProfile(),
          dailyMeals: getTodayDailyMeals(),
          weeklyPlan: getLatestWeeklyPlan(),
          currentStreak: 0,
          appState: getCloudAppState(),
        }

        // 3. Apply merged data to localStorage
        applyMerged(merged)

        // 4. Push merged data back to cloud
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        })

        // 5. Mark synced for this session
        sessionStorage.setItem(sessionKey, '1')

        // 6. Notify the rest of the app to reload state
        window.dispatchEvent(new Event('macroday:synced'))

        const hasCloudData = cloud && (
          (cloud.inbodyHistory?.length ?? 0) > 0 ||
          cloud.profile != null
        )
        if (hasCloudData) {
          toast.success('雲端數據已同步 ✓')
        }
      } catch (err) {
        console.error('[CloudSync]', err)
      }
    }

    sync()
  }, [status, session?.user?.id])
}
