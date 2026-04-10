import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyOTPToken } from '@/lib/otp'
import { upsertUser } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp:   { label: 'Code',  type: 'text'  },
        token: { label: 'Token', type: 'text'  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp || !credentials?.token) return null
        const valid = verifyOTPToken(credentials.token, credentials.email, credentials.otp)
        if (!valid) return null
        const email = credentials.email.toLowerCase().trim()
        return { id: email, email, name: email.split('@')[0], image: null }
      },
    }),
  ],

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id        = user.id ?? user.email!
        token.provider  = account?.provider ?? 'email-otp'
        token.createdAt = (token.createdAt as string) ?? new Date().toISOString()
        token.lastLogin = new Date().toISOString()

        // Phase 2: sync to Vercel Postgres (no-op in Phase 1)
        await upsertUser({
          email:    user.email!,
          name:     user.name  ?? (profile as { name?: string })?.name ?? null,
          image:    user.image ?? (profile as { picture?: string })?.picture ?? null,
          provider: account?.provider ?? 'email-otp',
        })
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id as string
        session.user.provider  = token.provider as 'google' | 'email-otp'
        session.user.createdAt = token.createdAt as string
        session.user.lastLogin = token.lastLogin as string
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      return baseUrl
    },
  },

  pages: {
    signIn: '/',
  },
}
