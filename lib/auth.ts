import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyOTPToken } from '@/lib/otp'
import { getUserByEmail, upsertUser } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'Code', type: 'text' },
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp || !credentials?.token) return null
        const valid = verifyOTPToken(credentials.token, credentials.email, credentials.otp)
        if (!valid) return null
        const email = credentials.email.toLowerCase().trim()
        const dbUser =
          (await getUserByEmail(email)) ??
          (await upsertUser({
            email,
            name: email.split('@')[0],
            image: null,
            provider: 'email-otp',
          }))

        return {
          id: dbUser.id,
          email,
          name: dbUser.name ?? email.split('@')[0],
          image: dbUser.image,
          isPro: dbUser.isPro,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.email) {
        const dbUser = await upsertUser({
          email: user.email,
          name: user.name ?? (profile as { name?: string })?.name ?? null,
          image: user.image ?? (profile as { picture?: string })?.picture ?? null,
          provider: account?.provider ?? 'email-otp',
        })

        token.id = dbUser.id
        token.provider = account?.provider ?? 'email-otp'
        token.createdAt = (token.createdAt as string) ?? dbUser.createdAt.toISOString()
        token.lastLogin = new Date().toISOString()
        token.isPro = dbUser.isPro
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider as 'google' | 'apple' | 'email-otp'
        session.user.createdAt = token.createdAt as string
        session.user.lastLogin = token.lastLogin as string
        session.user.isPro = Boolean(token.isPro)
      }
      return session
    },
    async redirect({ baseUrl }) {
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
