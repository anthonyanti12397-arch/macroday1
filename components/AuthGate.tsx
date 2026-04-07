'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useGuestSession } from '@/hooks/useGuestSession'
import LoginScreen from './LoginScreen'
import LoadingScreen from './LoadingScreen'

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { isGuest, loginAsGuest, isHydrated } = useGuestSession()

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
