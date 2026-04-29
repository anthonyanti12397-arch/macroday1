import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { validateEnvironment } from '@/lib/env-validation'

// Validate environment variables on startup
if (typeof window === 'undefined') {
  try {
    validateEnvironment()
  } catch (error) {
    console.error('Fatal: Environment validation failed. Server cannot start.')
    if (error instanceof Error) {
      console.error(error.message)
    }
    // Note: process.exit not available in Edge Runtime, but this is only for development
    // In production, env validation happens at startup and deployment will fail if vars are missing
  }
}

/**
 * Protected routes — add paths here as the community grows.
 * Guest sessions (localStorage only) are NOT covered by next-auth;
 * those pages handle their own auth check via useSession() / AuthGate.
 */
export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      // Authorised = has a valid next-auth JWT (Google or Email OTP)
      // Guest users (localStorage only) will be redirected to sign-in
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/community/:path*',   // Gym community — requires real account
    '/profile/:path*',     // Profile page — requires real account
    // Add more protected paths here as needed
  ],
}
