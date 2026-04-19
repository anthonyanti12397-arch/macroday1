import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider: 'google' | 'apple' | 'email-otp' | 'guest'
      createdAt: string
      lastLogin: string
      isPro: boolean
      isAdFree: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    isPro?: boolean
    isAdFree?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    provider: string
    createdAt: string
    lastLogin: string
    isPro?: boolean
    isAdFree?: boolean
  }
}
