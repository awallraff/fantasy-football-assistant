import { useState, useCallback, useRef, useEffect } from "react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"
import { fetchWithRetry } from "@/lib/fetch-with-retry"

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
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithRetry('/api/nfl-data?action=test')
      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection')
      setTestResult({ success: false, message: 'Connection failed' })
    } finally {
      setLoading(false)
    }
  }, [])

  const extractData = useCallback(async () => {
    // Generate unique request ID for logging and debugging
    const requestId = `nfl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`[${requestId}] NFL data fetch started`, {
      years: selectedYears,
      positions: selectedPositions,
      week: selectedWeek,
      timestamp: new Date().toISOString()
    })

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      console.log(`[${requestId}] Aborting previous request`)
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

      const duration = Date.now() - startTime
      console.log(`[${requestId}] NFL data fetch completed`, {
        duration_ms: duration,
        records: responseData?.metadata?.total_players,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`[${requestId}] NFL data fetch aborted`)
        return
      }

      const duration = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract NFL data'
      setError(errorMessage)

      console.error(`[${requestId}] NFL data fetch failed after ${duration}ms`, {
        error: errorMessage,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      })
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
      console.log("Auto-loading NFL data...")
      extractData().catch(error => {
        console.error("Failed to auto-load data:", error)
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
