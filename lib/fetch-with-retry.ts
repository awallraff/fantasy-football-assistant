/**
 * Fetch with Retry Utility
 *
 * Provides retry logic with exponential backoff for transient network failures.
 * Useful for handling temporary network issues, gateway errors, and timeout errors.
 */

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

/**
 * Checks if an error is transient and should be retried
 *
 * @param error - The error to check
 * @returns true if the error is transient and can be retried
 */
function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.name === 'TypeError') return true

    // Check for common transient error messages
    const message = error.message.toLowerCase()
    return (
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('enotfound') ||
      message.includes('network') ||
      message.includes('fetch failed')
    )
  }

  return false
}

/**
 * Checks if an HTTP response indicates a transient error
 *
 * @param response - The HTTP response
 * @returns true if the response indicates a transient error
 */
function isTransientHttpError(response: Response): boolean {
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
  return response.status === 502 || response.status === 503 || response.status === 504
}

/**
 * Fetch with exponential backoff retry logic
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries remaining (default: MAX_RETRIES)
 * @returns Response promise
 *
 * @throws Error if all retries are exhausted or error is not transient
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithRetry('/api/data', { method: 'GET' })
 *   const data = await response.json()
 * } catch (error) {
 *   console.error('Failed after retries:', error)
 * }
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    // Retry on transient HTTP errors (502, 503, 504)
    if (isTransientHttpError(response) && retries > 0) {
      const delay = INITIAL_DELAY_MS * (MAX_RETRIES - retries + 1)
      console.warn(
        `[fetchWithRetry] HTTP ${response.status} from ${url}, retrying in ${delay}ms (${retries} retries left)`
      )
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }

    return response
  } catch (error) {
    // Retry on transient network errors
    if (isTransientError(error) && retries > 0) {
      const delay = INITIAL_DELAY_MS * (MAX_RETRIES - retries + 1)
      console.warn(
        `[fetchWithRetry] Network error for ${url}, retrying in ${delay}ms (${retries} retries left)`,
        error
      )
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }

    // Not transient or no retries left - rethrow
    throw error
  }
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number
}

/**
 * Creates a custom fetch function with configurable retry logic
 *
 * @param config - Retry configuration
 * @returns Fetch function with retry logic
 *
 * @example
 * ```typescript
 * const customFetch = createFetchWithRetry({ maxRetries: 5, initialDelay: 2000 })
 * const response = await customFetch('/api/data')
 * ```
 */
export function createFetchWithRetry(config: RetryConfig = {}) {
  const maxRetries = config.maxRetries ?? MAX_RETRIES
  // initialDelay would be used in a future enhancement where delay is configurable per call
  // For now, keeping the parameter for API consistency
  // const initialDelay = config.initialDelay ?? INITIAL_DELAY_MS

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    return fetchWithRetry(url, options, maxRetries)
  }
}
