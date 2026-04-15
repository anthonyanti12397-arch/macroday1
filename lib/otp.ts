/**
 * Stateless OTP — no Redis/DB needed.
 * The OTP + expiry are HMAC-signed and returned to the client as an opaque token.
 * On verify, the server re-derives the signature and checks OTP + expiry.
 */
import { createHmac, randomInt, timingSafeEqual } from 'crypto'

const OTP_TTL_MS = 10 * 60 * 1000

const secret = () => {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is not set')
  return s
}

/** Generate a 6-digit numeric OTP */
export function generateOTP(): string {
  return String(randomInt(100000, 999999))
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/** Sign {email, otp, exp} and return base64url token */
export function signOTPToken(email: string, otp: string): string {
  const exp = Date.now() + OTP_TTL_MS
  const payload = JSON.stringify({ email: normalizeEmail(email), otp, exp })
  const sig = createHmac('sha256', secret()).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url')
}

/** Verify token. Returns true only if HMAC valid, email/otp match, and not expired */
export function verifyOTPToken(
  token: string,
  inputEmail: string,
  inputOtp: string
): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString()
    const { payload, sig } = JSON.parse(raw) as { payload: string; sig: string }
    const expected = createHmac('sha256', secret()).update(payload).digest('hex')
    // Timing-safe comparison using native crypto method
    if (sig.length !== expected.length) return false
    const match = timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    if (!match) return false
    
    const { email, otp, exp } = JSON.parse(payload) as { email: string; otp: string; exp: number }
    if (email !== normalizeEmail(inputEmail)) return false
    if (otp !== inputOtp.trim()) return false
    if (Date.now() > exp) return false
    return true
  } catch {
    return false
  }
}
