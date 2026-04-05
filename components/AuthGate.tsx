'use client'

import { useEffect, useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { getGuestSession } from '@/lib/storage'
import LoginScreen from './LoginScreen'

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [guestLoggedIn, setGuestLoggedIn] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setGuestLoggedIn(!!getGuestSession())
    setReady(true)
  }, [])

  // Wait for both local check and NextAuth to resolve
  if (!ready || status === 'loading') return null

  const isLoggedIn = guestLoggedIn || !!session

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setGuestLoggedIn(true)} />
  }

  return <>{children}</>
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </SessionProvider>
  )
}
