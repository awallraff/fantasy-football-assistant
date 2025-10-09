import { useState, useCallback, useRef, useEffect } from 'react'
import { AIRankingsService } from '@/lib/ai-rankings-service'
import { getNextUpcomingWeek } from '@/lib/nfl-season-utils'
import type { RankingSystem } from '@/lib/rankings-types'
import { debugLog, debugError } from '@/lib/debug-utils'

/**
 * Projection type for AI rankings
 */
export type ProjectionType = "season" | "weekly"

/**
 * Options for AI ranking generation
 */
export interface AIRankingGenerationOptions {
  year?: number
  week?: number
  projectionType?: ProjectionType
}

/**
 * Return type for the useAIRankingsGenerator hook
 */
export interface UseAIRankingsGeneratorReturn {
  // State
  isGenerating: boolean
  error: string | null
  selectedYear: number
  selectedWeek: number | null
  projectionType: ProjectionType

  // Actions
  generateRankings: (allSystems: RankingSystem[], options?: AIRankingGenerationOptions) => Promise<RankingSystem | null>
  setProjectionType: (type: ProjectionType) => void
  setSelectedYear: (year: number) => void
  setSelectedWeek: (week: number | null) => void
  clearError: () => void
}

/**
 * Custom hook for AI rankings generation.
 *
 * This hook encapsulates:
 * - Loading state during generation
 * - Error handling with user-friendly messages
 * - Year/week selection for predictions
 * - Projection type (season vs. weekly)
 * - Integration with AIRankingsService
 *
 * @example
 * ```tsx
 * const {
 *   generateRankings,
 *   isGenerating,
 *   error,
 *   projectionType,
 *   setProjectionType
 * } = useAIRankingsGenerator()
 *
 * // Generate rankings
 * const aiSystem = await generateRankings(allSystems, {
 *   projectionType: 'weekly'
 * })
 * ```
 */
export function useAIRankingsGenerator(): UseAIRankingsGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [projectionType, setProjectionType] = useState<ProjectionType>("weekly")

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Generate AI rankings with error handling and state management
   */
  const generateRankings = useCallback(async (
    allSystems: RankingSystem[],
    options: AIRankingGenerationOptions = {}
  ): Promise<RankingSystem | null> => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Get next upcoming week as default
    const { year: nextYear, week: nextWeek } = getNextUpcomingWeek()

    // Determine target parameters
    const targetYear = options.year || nextYear
    const currentProjectionType = options.projectionType || projectionType

    // For season projections, don't specify a week
    const targetWeek = currentProjectionType === "season"
      ? undefined
      : (options.week || nextWeek)

    setIsGenerating(true)
    setError(null)

    try {
      const projectionDesc = currentProjectionType === "season"
        ? `${targetYear} season`
        : `Week ${targetWeek} of ${targetYear}`

      debugLog(`Generating AI rankings predictions for ${projectionDesc}`)

      const aiService = new AIRankingsService()
      const aiSystem = await aiService.generateAIRankings(allSystems, {
        year: targetYear,
        week: targetWeek,
        useHistoricalData: true // Use historical data to inform future predictions
      })

      // Update state to reflect what we generated
      setSelectedYear(targetYear)
      setSelectedWeek(targetWeek || null)
      setProjectionType(currentProjectionType)

      return aiSystem
    } catch (err) {
      // Handle aborted requests gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        debugLog('AI ranking generation cancelled')
        return null
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI rankings'
      debugError("Error generating AI rankings:", err)
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [projectionType])

  // Cleanup effect: abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    isGenerating,
    error,
    selectedYear,
    selectedWeek,
    projectionType,

    // Actions
    generateRankings,
    setProjectionType,
    setSelectedYear,
    setSelectedWeek,
    clearError,
  }
}
