import { useState, useCallback, useRef, useEffect } from "react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"
import { fetchWithRetry } from "@/lib/fetch-with-retry"
import { logger, generateRequestId } from "@/lib/logging-service"

/**
 * Merges multiple NFL data responses into a single response
 */
function mergeNFLDataResponses(responses: NFLDataResponse[]): NFLDataResponse {
  if (responses.length === 0) {
    return {
      metadata: {
        years: [],
        positions: [],
        week: undefined,
        extracted_at: new Date().toISOString(),
        total_players: 0,
        total_weekly_records: 0,
        total_seasonal_records: 0,
        total_aggregated_records: 0,
        total_teams: 0,
      },
      weekly_stats: [],
      seasonal_stats: [],
      aggregated_season_stats: [],
      player_info: [],
      team_analytics: [],
    }
  }

  if (responses.length === 1) {
    return responses[0]
  }

  // Merge all responses
  const allYears = new Set<number>()
  const allPositions = new Set<string>()
  let commonWeek: number | undefined = responses[0].metadata?.week

  const merged: NFLDataResponse = {
    metadata: {
      years: [],
      positions: [],
      week: commonWeek,
      extracted_at: new Date().toISOString(),
      total_players: 0,
      total_weekly_records: 0,
      total_seasonal_records: 0,
      total_aggregated_records: 0,
      total_teams: 0,
    },
    weekly_stats: [],
    seasonal_stats: [],
    aggregated_season_stats: [],
    player_info: [],
    team_analytics: [],
  }

  for (const response of responses) {
    // Collect years and positions
    response.metadata?.years?.forEach(y => allYears.add(y))
    response.metadata?.positions?.forEach(p => allPositions.add(p))

    // Sum metadata
    merged.metadata.total_players += response.metadata?.total_players || 0
    merged.metadata.total_weekly_records += response.metadata?.total_weekly_records || 0
    merged.metadata.total_seasonal_records += response.metadata?.total_seasonal_records || 0
    merged.metadata.total_aggregated_records += response.metadata?.total_aggregated_records || 0
    merged.metadata.total_teams += response.metadata?.total_teams || 0

    // Merge arrays
    merged.weekly_stats.push(...(response.weekly_stats || []))
    merged.seasonal_stats.push(...(response.seasonal_stats || []))
    merged.aggregated_season_stats.push(...(response.aggregated_season_stats || []))
    merged.player_info.push(...(response.player_info || []))
    merged.team_analytics.push(...(response.team_analytics || []))
  }

  // Set merged years and positions
  merged.metadata.years = Array.from(allYears).sort()
  merged.metadata.positions = Array.from(allPositions).sort()

  return merged
}

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
  progress: { current: number; total: number; position: string } | null
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
  const [progress, setProgress] = useState<{ current: number; total: number; position: string } | null>(null)

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

    logger.info('NFL data fetch started (sequential)', {
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
    setProgress(null)

    try {
      // Fetch positions sequentially to avoid timeout
      const allData: NFLDataResponse[] = []
      const totalPositions = selectedPositions.length

      for (let i = 0; i < totalPositions; i++) {
        const position = selectedPositions[i]

        // Update progress
        setProgress({
          current: i + 1,
          total: totalPositions,
          position: position
        })

        logger.info(`Fetching position ${i + 1}/${totalPositions}: ${position}`, undefined, requestId)

        const params = new URLSearchParams({
          action: 'extract',
          years: selectedYears.join(','),
          positions: position // Single position at a time
        })

        if (selectedWeek && selectedWeek !== "all") {
          params.set('week', selectedWeek)
        }

        const response = await fetchWithRetry(`/api/nfl-data?${params}`, { signal })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} (Position: ${position})`)
        }

        const responseData = await response.json()

        if (responseData.error) {
          throw new Error(`${responseData.error} (Position: ${position})`)
        }

        allData.push(responseData)
      }

      // Merge all position data
      const mergedData = mergeNFLDataResponses(allData)
      setData(mergedData)
      setProgress(null)

      timer.end('NFL data fetch completed (sequential)', {
        positions: totalPositions,
        records: mergedData?.metadata?.total_players,
      })
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug('NFL data fetch aborted', undefined, requestId)
        setProgress(null)
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to extract NFL data'
      setError(errorMessage)
      setProgress(null)

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
    progress,
  }
}
