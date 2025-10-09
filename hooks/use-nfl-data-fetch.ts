import { useState, useCallback, useRef, useEffect } from "react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"
import { fetchWithRetry } from "@/lib/fetch-with-retry"
import { logger, generateRequestId } from "@/lib/logging-service"

export interface UseNFLDataFetchOptions {
  selectedYears: string[]
  selectedPositions: string[]
  selectedWeek: string
  autoLoad?: boolean
}

export interface UseNFLDataFetchResult {
  data: NFLDataResponse | null
  loading: boolean
  error: string | null
  testResult: { success: boolean; message: string } | null
  testConnection: () => Promise<void>
  extractData: () => Promise<void>
}

/**
 * Custom hook for fetching NFL data from the API
 * Handles connection testing, data extraction, and race condition prevention
 */
export function useNFLDataFetch({
  selectedYears,
  selectedPositions,
  selectedWeek,
  autoLoad = true,
}: UseNFLDataFetchOptions): UseNFLDataFetchResult {
  const [data, setData] = useState<NFLDataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Refs for race condition prevention
  const hasInitialLoadAttempted = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const testConnection = useCallback(async () => {
    const requestId = generateRequestId('nfl-test')

    logger.info('NFL connection test started', undefined, requestId)
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithRetry('/api/nfl-data?action=test')
      const result = await response.json()
      setTestResult(result)

      logger.info('NFL connection test completed', { success: result.success }, requestId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection'
      setError(errorMessage)
      setTestResult({ success: false, message: 'Connection failed' })

      logger.error(
        'NFL connection test failed',
        err instanceof Error ? err : new Error(errorMessage),
        {},
        requestId
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const extractData = useCallback(async () => {
    // Generate unique request ID for logging and debugging
    const requestId = generateRequestId('nfl-data')
    const timer = logger.startTimer(requestId)

    logger.info('NFL data fetch started', {
      years: selectedYears,
      positions: selectedPositions,
      week: selectedWeek,
    }, requestId)

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      logger.debug('Aborting previous request', undefined, requestId)
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        action: 'extract',
        years: selectedYears.join(','),
        positions: selectedPositions.join(',')
      })

      if (selectedWeek && selectedWeek !== "all") {
        params.set('week', selectedWeek)
      }

      const response = await fetchWithRetry(`/api/nfl-data?${params}`, { signal })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      if (responseData.error) {
        throw new Error(responseData.error)
      }

      setData(responseData)

      timer.end('NFL data fetch completed', {
        records: responseData?.metadata?.total_players,
      })
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug('NFL data fetch aborted', undefined, requestId)
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to extract NFL data'
      setError(errorMessage)

      logger.error(
        'NFL data fetch failed',
        err instanceof Error ? err : new Error(errorMessage),
        {},
        requestId
      )
    } finally {
      setLoading(false)
    }
  }, [selectedYears, selectedPositions, selectedWeek])

  // AUTO-LOAD GUARD:
  // Prevents double-loading in React Strict Mode (which intentionally double-mounts
  // components in dev). Without this guard, autoLoad would trigger twice, wasting
  // a Python child process spawn and potentially causing race conditions.
  useEffect(() => {
    if (autoLoad && !hasInitialLoadAttempted.current && !data && !loading) {
      hasInitialLoadAttempted.current = true
      logger.info("Auto-loading NFL data on mount")
      extractData().catch(error => {
        logger.error("Failed to auto-load NFL data", error instanceof Error ? error : new Error(String(error)))
      })
    }
  }, [autoLoad, data, loading, extractData])

  // Cleanup: abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    testResult,
    testConnection,
    extractData,
  }
}
