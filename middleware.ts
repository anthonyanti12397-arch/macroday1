import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Protected routes — add paths here as the community grows.
 * Guest sessions (localStorage only) are NOT covered by next-auth;
 * those pages handle their own auth check via useSession() / AuthGate.
 */
export default withAuth(
  function middleware(req) {
    // Could add role checks here later, e.g. req.nextauth.token?.role === 'admin'
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
