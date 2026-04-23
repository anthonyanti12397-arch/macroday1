import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyOTPToken } from '@/lib/otp'
import { getUserByEmail, getUserById, resolveOAuthUser, upsertUser } from '@/lib/db'

// Validate OAuth environment variables
const hasAppleOAuth = process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
if (!hasAppleOAuth) {
  console.warn(
    '[NextAuth] Apple OAuth not configured. Set APPLE_CLIENT_ID and APPLE_CLIENT_SECRET to enable Apple login.',
    { hasId: !!process.env.APPLE_CLIENT_ID, hasSecret: !!process.env.APPLE_CLIENT_SECRET }
  )
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(hasAppleOAuth
      ? [AppleProvider({
          clientId: process.env.APPLE_CLIENT_ID!,
          clientSecret: process.env.APPLE_CLIENT_SECRET!,
        })]
      : []),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'Code', type: 'text' },
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.otp || !credentials?.token) {
            console.warn('[EmailOTP] Missing credentials', {
              hasEmail: !!credentials?.email,
              hasOtp: !!credentials?.otp,
              hasToken: !!credentials?.token,
            })
            return null
          }

          const valid = verifyOTPToken(credentials.token, credentials.email, credentials.otp)
          if (!valid) {
            console.warn('[EmailOTP] Invalid OTP token/code for email:', credentials.email)
            return null
          }

          const email = credentials.email.toLowerCase().trim()
          const dbUser =
            (await getUserByEmail(email)) ??
            (await upsertUser({
              email,
              name: email.split('@')[0],
              image: null,
              provider: 'email-otp',
            }))

          if (!dbUser) {
            console.error('[EmailOTP] Failed to create or find user for email:', email)
            return null
          }

          console.log('[EmailOTP] User authorized:', { userId: dbUser.id, email })
          return {
            id: dbUser.id,
            email,
            name: dbUser.name ?? email.split('@')[0],
            image: dbUser.image,
            isPro: dbUser.isPro,
          }
        } catch (err) {
          console.error('[EmailOTP] Authorization error:', err)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger === 'update' && token.id) {
        // Re-fetch from DB to pick up Pro/AdFree changes after payment
        const dbUser = await getUserById(token.id as string)
        if (dbUser) {
          token.isPro = dbUser.isPro
          token.isAdFree = dbUser.isAdFree
        }
        return token
      }
      const provider = account?.provider ?? 'email-otp'
      const email =
        user?.email?.toLowerCase().trim() ??
        token.email?.toLowerCase().trim() ??
        (profile as { email?: string })?.email?.toLowerCase().trim() ??
        null
      const name = user?.name ?? token.name ?? (profile as { name?: string })?.name ?? null
      const image =
        user?.image ??
        (token.picture as string | undefined) ??
        (profile as { picture?: string })?.picture ??
        null

      let dbUser = null

      try {
        if (provider !== 'email-otp' && account?.providerAccountId) {
          // OAuth flow: resolve or create user linked to OAuth account
          dbUser = await resolveOAuthUser({
            provider,
            providerAccountId: account.providerAccountId,
            email,
            name,
            image,
          })
        } else if (provider !== 'email-otp' && !account?.providerAccountId) {
          // ERROR: OAuth without providerAccountId — something is wrong
          console.error(`[NextAuth JWT] OAuth provider "${provider}" missing providerAccountId`, {
            account,
            profile,
            email,
          })
          return token // Return empty token, login will fail
        } else if (email) {
          // Email-OTP flow: create or update user by email
          dbUser = await upsertUser({
            email,
            name,
            image,
            provider,
          })
        } else {
          // No email, no providerAccountId — can't create user
          console.warn(`[NextAuth JWT] Cannot create user: no email or providerAccountId`, {
            provider,
            account,
          })
          return token
        }

        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email ?? email ?? undefined
          token.name = dbUser.name ?? token.name
          token.picture = dbUser.image ?? token.picture
          token.provider = provider
          token.createdAt = (token.createdAt as string) ?? dbUser.createdAt.toISOString()
          token.lastLogin = new Date().toISOString()
          token.isPro = dbUser.isPro
          token.isAdFree = dbUser.isAdFree
        }
      } catch (err) {
        console.error(`[NextAuth JWT] Error during user resolution:`, err)
        return token // Return empty token on error
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
        session.user.isAdFree = Boolean(token.isAdFree)
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
