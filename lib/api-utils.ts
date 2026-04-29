import { NextResponse } from 'next/server'

/**
 * Structured error response format
 */
export interface ApiError {
  error: string
  code?: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
}

/**
 * Create a structured error response
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500,
  code?: string,
  details?: Record<string, any>
): NextResponse<ApiError> {
  const message = error instanceof Error ? error.message : String(error)

  return NextResponse.json(
    {
      error: message,
      code: code || `ERROR_${status}`,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Log API error with context
 */
export function logApiError(
  context: string,
  error: unknown,
  additionalData?: Record<string, any>
): void {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error(JSON.stringify({
    timestamp,
    context,
    error: message,
    stack,
    ...additionalData,
  }))
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier } = mergedConfig

  let lastError: Error | null = null
  let delay = initialDelayMs!

  for (let attempt = 1; attempt <= maxAttempts!; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        logApiError(`${context} - Max retries exceeded`, lastError, {
          attempts: attempt,
          context,
        })
        throw lastError
      }

      // Calculate delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier!, maxDelayMs!)

      console.warn(`[${context}] Attempt ${attempt} failed, retrying in ${delay}ms...`, {
        error: lastError.message,
        attempt,
        maxAttempts,
      })

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Should never reach here
  throw lastError || new Error('Retry failed without error')
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(required: string[]): string[] {
  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    logApiError('Missing environment variables', new Error('Env validation failed'), {
      missing,
      required,
    })
  }

  return missing
}

/**
 * Wrapper for Stripe API calls with error handling and retry logic
 */
export async function stripeApiCall<T>(
  fn: () => Promise<T>,
  operation: string,
  config?: RetryConfig
): Promise<T> {
  try {
    return await retryWithBackoff(fn, `Stripe:${operation}`, config)
  } catch (error) {
    logApiError(`Stripe API Error: ${operation}`, error)
    throw error
  }
}

/**
 * Extract Stripe error code from API errors
 */
export function getStripeErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as any).code
  }
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return (error as any).type
  }
  return 'unknown_error'
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const code = getStripeErrorCode(error)

  // Retry on rate limits and temporary failures
  const retryableCodes = [
    'rate_limit_error',
    'api_error',
    'api_connection_error',
    'timeout',
    'ERR_NETWORK',
    'ECONNREFUSED',
    'ECONNRESET',
  ]

  return retryableCodes.includes(code)
}
