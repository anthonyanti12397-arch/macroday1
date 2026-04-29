import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateOTP, normalizeEmail, signOTPToken } from '@/lib/otp'

// Simple in-memory rate limiter (per lambda instance)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const normalizedEmail = normalizeEmail(email)
    
    // Rate Limiting (max 3 per minute)
    const now = Date.now()
    const limitRecord = rateLimitMap.get(normalizedEmail)
    if (limitRecord) {
      if (now - limitRecord.timestamp < 60000) {
        if (limitRecord.count >= 3) {
          return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
        }
        limitRecord.count += 1
      } else {
        rateLimitMap.set(normalizedEmail, { count: 1, timestamp: now })
      }
    } else {
      rateLimitMap.set(normalizedEmail, { count: 1, timestamp: now })
    }

    const otp   = generateOTP()
    const token = signOTPToken(normalizedEmail, otp)

    // Ensure from address has proper format for Resend
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const from = fromEmail.includes('<') ? fromEmail : `MacroDay <${fromEmail}>`

    const { error } = await resend.emails.send({
      from,
      to:   normalizedEmail,
      subject: `${otp} — MacroDay 登入驗證碼`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F9E75,#0BD68A);padding:32px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">⚡ MacroDay</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">AI 每日飲食教練</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#475569;">你的登入驗證碼：</p>
            <div style="background:#F0FDF9;border:2px solid #0F9E75;border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
              <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:16px;color:#0F172A;">${otp}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
              此驗證碼 <strong>10 分鐘內有效</strong>，請勿分享給任何人。<br/>
              如非你本人操作，請忽略此郵件。
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              MacroDay · AI 驅動的個人化營養管理
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    if (error) {
      console.error('Resend error:', JSON.stringify(error, null, 2))
      console.error('Resend error message:', error.message)
      console.error('Email from:', from)
      console.error('Email to:', normalizedEmail)
      return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 })
    }

    // Return the signed token — client stores it and passes it back during verify
    // Also return OTP in dev for testing purposes
    const response: any = { token }
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp
      console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`)
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
