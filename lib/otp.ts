/**
 * Stateless OTP — no Redis/DB needed.
 * The OTP + expiry are HMAC-signed and returned to the client as an opaque token.
 * On verify, the server re-derives the signature and checks OTP + expiry.
 */
import { createHmac, randomInt } from 'crypto'

const secret = () => {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is not set')
  return s
}

/** Generate a 6-digit numeric OTP */
export function generateOTP(): string {
  return String(randomInt(100000, 999999))
}

/** Sign {email, otp, exp} and return base64url token */
export function signOTPToken(email: string, otp: string): string {
  const exp = Date.now() + 10 * 60 * 1000  // 10 minutes
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), otp, exp })
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
    // Timing-safe comparison
    if (sig.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return false
    const { email, otp, exp } = JSON.parse(payload) as { email: string; otp: string; exp: number }
    if (email !== inputEmail.toLowerCase().trim()) return false
    if (otp !== inputOtp.trim()) return false
    if (Date.now() > exp) return false
    return true
  } catch {
    return false
  }
}
