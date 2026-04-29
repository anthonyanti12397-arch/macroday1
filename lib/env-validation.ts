/**
 * Environment variable validation
 * Runs at startup to ensure all required env vars are configured
 */

// Required environment variables by environment
const requiredByEnv = {
  all: [
    // Database
    'DATABASE_URL',
    'DIRECT_URL',
    // NextAuth
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    // Stripe
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    // Email
    'RESEND_API_KEY',
  ],
  production: [
    'STRIPE_SECRET_KEY', // Must use live key in production
  ],
}

// Optional environment variables (log warning if missing)
const optional = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'APPLE_CLIENT_ID',
  'APPLE_CLIENT_SECRET',
  'XAI_API_KEY',
  'TOGETHER_API_KEY',
  'SILICONFLOW_API_KEY',
  'ANTHROPIC_API_KEY',
]

/**
 * Validate required environment variables
 * Throws error if critical vars are missing
 */
export function validateEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const required = [
    ...requiredByEnv.all,
    ...(nodeEnv === 'production' ? requiredByEnv.production : []),
  ]

  const missing: string[] = []
  const warnings: string[] = []

  // Check required vars
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // Check optional vars
  for (const key of optional) {
    if (!process.env[key]) {
      warnings.push(key)
    }
  }

  // Report missing required vars
  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    )
    console.error('❌ Environment validation failed:', error.message)
    throw error
  }

  // Warn about optional vars
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `⚠️  Optional environment variables not configured: ${warnings.join(', ')}\n` +
      `Some features may not work without these. See .env.example for details.`
    )
  }

  // Validate Stripe key format
  if (process.env.STRIPE_SECRET_KEY) {
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must start with "sk_"')
    }
    if (nodeEnv === 'production' && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      throw new Error('STRIPE_SECRET_KEY must use live key (sk_live_) in production')
    }
  }

  // Validate Resend API key format
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_')) {
    throw new Error('RESEND_API_KEY must start with "re_"')
  }

  console.log('✅ Environment variables validated')
}

/**
 * Get environment variable with type safety
 * Throws error if variable is not set
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}
