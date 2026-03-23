"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { getCurrentNFLWeek } from "@/lib/nfl-season-utils"
// PERF-001 fix: Lazy-load AI service to defer heavy initialization
// import { AIRankingsService } from "@/lib/ai-rankings-service"

interface PlayerProjection {
  weeklyProjection: number
  tier: number
  confidence: number
}

interface ProjectionsContextType {
  getProjection: (playerId: string, playerName?: string) => PlayerProjection | null
  loadProjectionsForPlayers: (playerIds: string[], playerNames?: Map<string, string>) => Promise<void>
  isLoading: boolean
  lastUpdated: Date | null
}

const ProjectionsContext = createContext<ProjectionsContextType | undefined>(undefined)

/** Same NFL week: avoid re-running heavy AI generation on every navigation (TD-2026-03-20-001). */
const SAME_WEEK_CACHE_MS = 60 * 60 * 1000 // 1 hour

export function ProjectionsProvider({ children }: { children: ReactNode }) {
  const [projections, setProjections] = useState<Map<string, PlayerProjection>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loadingPromise, setLoadingPromise] = useState<Promise<void> | null>(null)

  // PERF-001 fix: Batch pending requests to reduce API calls
  const pendingRequestsRef = useRef<{
    playerIds: Set<string>
    playerNames: Map<string, string>
    timeoutId: NodeJS.Timeout | null
  }>({ playerIds: new Set(), playerNames: new Map(), timeoutId: null })
  /** Week we last completed a full AI rankings fetch (reduces TBT from repeat work). */
  const generatedForWeekRef = useRef<number | null>(null)

  const getProjection = useCallback(
    (playerId: string, playerName?: string): PlayerProjection | null => {
      // Try by player ID first
      let projection = projections.get(playerId)
      if (projection) return projection

      // Try by normalized player name
      if (playerName) {
        const normalizedName = playerName
          .toLowerCase()
          .replace(/[^a-z\s]/g, "")
          .trim()
        projection = projections.get(`name:${normalizedName}`)
        if (projection) return projection
      }

      return null
    },
    [projections],
  )

  // PERF-001 fix: Batch requests with 100ms window to reduce API calls
  const executeBatchLoad = useCallback(async () => {
    const batch = pendingRequestsRef.current
    const playerIds = Array.from(batch.playerIds)
    const playerNames = new Map(batch.playerNames)

    // Clear batch
    batch.playerIds.clear()
    batch.playerNames.clear()
    batch.timeoutId = null

    if (playerIds.length === 0) return

    setIsLoading(true)

    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Projections] Loading batch of ${playerIds.length} players`)
      }

      // PERF-001 fix: Lazy-load AI service only when needed
      const { AIRankingsService } = await import("@/lib/ai-rankings-service")

      let aiService: InstanceType<typeof AIRankingsService>
      try {
        aiService = new AIRankingsService()
      } catch (error) {
        console.error("Failed to initialize AI service:", error)
        return
      }

      const currentWeek = getCurrentNFLWeek()

      // Generate AI rankings with weekly projections
      const aiRankings = await aiService.generateAIRankings([], {
        year: 2025,
        week: currentWeek,
        useHistoricalData: true,
      })

      setProjections((prev) => {
        const newProjections = new Map<string, PlayerProjection>(prev)

        // Map AI rankings to player projections
        aiRankings.rankings.forEach((ranking) => {
          if (ranking.projectedPoints && ranking.tier) {
            const projection: PlayerProjection = {
              weeklyProjection: ranking.projectedPoints,
              tier: ranking.tier,
              confidence: 0.8, // Default confidence
            }

            // Try to match by player ID
            const matchingPlayerId = playerIds.find((id) => {
              const playerName = playerNames?.get(id)
              if (!playerName) return false

              return (
                playerName.toLowerCase().includes(ranking.playerName.toLowerCase()) ||
                ranking.playerName.toLowerCase().includes(playerName.toLowerCase())
              )
            })

            if (matchingPlayerId) {
              newProjections.set(matchingPlayerId, projection)
            }

            // Also store by normalized name for fallback
            const normalizedName = ranking.playerName
              .toLowerCase()
              .replace(/[^a-z\s]/g, "")
              .trim()
            if (normalizedName) {
              newProjections.set(`name:${normalizedName}`, projection)
            }
          }
        })

        return newProjections
      })
      generatedForWeekRef.current = currentWeek
      setLastUpdated(new Date())

      if (process.env.NODE_ENV === "development") {
        console.log(`[Projections] Cached projections for week ${currentWeek}`)
      }
    } catch (error) {
      console.error("Error loading projections:", error)
    } finally {
      setIsLoading(false)
      setLoadingPromise(null)
    }
  }, [])

  const loadProjectionsForPlayers = useCallback(
    async (playerIds: string[], playerNames?: Map<string, string>): Promise<void> => {
      const currentWeek = getCurrentNFLWeek()
      // Skip expensive AI work if we already filled projections this NFL week (within TTL)
      if (
        lastUpdated &&
        generatedForWeekRef.current === currentWeek &&
        Date.now() - lastUpdated.getTime() < SAME_WEEK_CACHE_MS
      ) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Projections] Using cached AI rankings for current week")
        }
        return Promise.resolve()
      }

      // Prevent multiple simultaneous loads
      if (loadingPromise) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Projections] Waiting for existing load to complete")
        }
        return loadingPromise
      }

      if (playerIds.length === 0) {
        return Promise.resolve()
      }

      // PERF-001 fix: Add to batch instead of loading immediately
      const batch = pendingRequestsRef.current
      playerIds.forEach((id) => batch.playerIds.add(id))
      if (playerNames) {
        playerNames.forEach((name, id) => batch.playerNames.set(id, name))
      }

      // Clear existing timeout
      if (batch.timeoutId) {
        clearTimeout(batch.timeoutId)
      }

      // Schedule batch load after 100ms (allows multiple rosters to batch together)
      const promise = new Promise<void>((resolve) => {
        batch.timeoutId = setTimeout(() => {
          executeBatchLoad().finally(() => resolve())
        }, 100)
      })

      setLoadingPromise(promise)
      return promise
    },
    [lastUpdated, loadingPromise, executeBatchLoad],
  )

  const value: ProjectionsContextType = {
    getProjection,
    loadProjectionsForPlayers,
    isLoading,
    lastUpdated,
  }

  return <ProjectionsContext.Provider value={value}>{children}</ProjectionsContext.Provider>
}

export function useProjections() {
  const context = useContext(ProjectionsContext)
  if (context === undefined) {
    throw new Error("useProjections must be used within a ProjectionsProvider")
  }
  return context
}
