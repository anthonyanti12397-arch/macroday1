'use client'

import { useEffect, useState } from 'react'
import { getGuestSession } from '@/lib/storage'
import LoginScreen from './LoginScreen'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!getGuestSession())
    setReady(true)
  }, [])

  // Avoid flash of login screen during hydration
  if (!ready) return null

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />
  }

  return <>{children}</>
}
