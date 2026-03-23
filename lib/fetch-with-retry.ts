/**
 * Backward-compatible re-export — use `@/lib/api-retry` for new code.
 *
 * TD-2026-03-20-007: single implementation lives in `api-retry.ts` (retry + backoff + jitter).
 */
export {
  fetchWithRetry,
  retryWithBackoff,
  defaultShouldRetry,
  type RetryOptions,
} from "./api-retry"
