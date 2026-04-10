import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider: 'google' | 'email-otp' | 'guest'
      createdAt: string
      lastLogin: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    provider: string
    createdAt: string
    lastLogin: string
  }
}
