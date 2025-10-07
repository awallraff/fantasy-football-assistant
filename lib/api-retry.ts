/**
 * API Retry Utility with Exponential Backoff
 *
 * Provides a robust retry mechanism for HTTP requests with:
 * - Exponential backoff strategy
 * - Configurable retry attempts
 * - Jitter to prevent thundering herd
 * - Custom retry conditions
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000ms) */
  initialDelayMs?: number
  /** Maximum delay between retries in milliseconds (default: 10000ms) */
  maxDelayMs?: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number
  /** Whether to add random jitter to delays (default: true) */
  useJitter?: boolean
  /** Custom function to determine if an error should be retried (default: retries on network/5xx errors) */
  shouldRetry?: (error: unknown, attemptNumber: number) => boolean
  /** Callback invoked before each retry attempt */
  onRetry?: (error: unknown, attemptNumber: number, delayMs: number) => void
}

export interface RetryState {
  attemptNumber: number
  totalDelay: number
  lastError: unknown
}

/**
 * Default retry condition: retry on network errors and 5xx server errors
 */
export function defaultShouldRetry(error: unknown, attemptNumber: number): boolean {
  // Don't retry if we've exhausted attempts (handled by retryWithBackoff)
  if (attemptNumber > 3) return false

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Retry on network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('fetch error')
    ) {
      return true
    }

    // Retry on specific HTTP status codes
    if (message.includes('http 5')) {
      return true
    }

    // Retry on rate limiting (429) with backoff
    if (message.includes('http 429') || message.includes('rate limit')) {
      return true
    }

    // Don't retry on client errors (4xx except 429)
    if (message.includes('http 4')) {
      return false
    }
  }

  // Retry on unknown errors
  return true
}

/**
 * Calculate delay with exponential backoff and optional jitter
 *
 * Uses Full Jitter algorithm as recommended by AWS:
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
function calculateDelay(
  attemptNumber: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  useJitter: boolean
): number {
  // Calculate exponential delay: initialDelay * (multiplier ^ attemptNumber)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attemptNumber - 1)

  // Cap at max delay
  let delay = Math.min(exponentialDelay, maxDelayMs)

  // Add jitter (randomness) to prevent thundering herd
  if (useJitter) {
    // Full Jitter: random between 0 and calculated delay
    // This is the AWS-recommended approach for preventing thundering herd
    delay = Math.random() * delay
  }

  return Math.floor(delay)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function call
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```ts
 * const data = await retryWithBackoff(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    useJitter = true,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options

  let lastError: unknown
  let totalDelay = 0

  for (let attemptNumber = 1; attemptNumber <= maxRetries + 1; attemptNumber++) {
    try {
      // Attempt the function call
      return await fn()
    } catch (error) {
      lastError = error

      // If this was the last attempt, throw the error
      if (attemptNumber > maxRetries) {
        throw error
      }

      // Check if we should retry this error
      if (!shouldRetry(error, attemptNumber)) {
        throw error
      }

      // Calculate delay for this retry
      const delay = calculateDelay(
        attemptNumber,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        useJitter
      )
      totalDelay += delay

      // Invoke retry callback if provided
      if (onRetry) {
        onRetry(error, attemptNumber, delay)
      }

      // Log retry attempt
      console.log(
        `Retry attempt ${attemptNumber}/${maxRetries} after ${delay}ms delay. Total delay: ${totalDelay}ms`,
        error instanceof Error ? error.message : error
      )

      // Wait before retrying
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError
}

/**
 * Wrapper for fetch with automatic retry and exponential backoff
 *
 * @param url - The URL to fetch
 * @param init - Fetch options
 * @param retryOptions - Retry configuration
 * @returns The Response object
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' }
 * }, {
 *   maxRetries: 3,
 *   initialDelayMs: 1000
 * })
 * ```
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init)

      // Throw on HTTP errors so they can be retried
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    },
    {
      ...retryOptions,
      shouldRetry: (error, attemptNumber) => {
        // Use custom retry logic if provided
        if (retryOptions?.shouldRetry) {
          return retryOptions.shouldRetry(error, attemptNumber)
        }

        // Default retry logic for fetch
        if (error instanceof Error) {
          const message = error.message

          // Don't retry on 4xx errors (except 429)
          if (message.includes('HTTP 4') && !message.includes('HTTP 429')) {
            return false
          }

          // Retry on 5xx, network errors, and 429
          return (
            message.includes('HTTP 5') ||
            message.includes('HTTP 429') ||
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('Failed to fetch')
          )
        }

        return true
      },
    }
  )
}
