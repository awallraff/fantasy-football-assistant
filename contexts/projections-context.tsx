"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { AIRankingsService } from "@/lib/ai-rankings-service"

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

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCurrentNFLWeek(): number {
  const now = new Date()
  const startOfSeason = new Date(now.getFullYear(), 8, 1) // September 1st
  const weeksSinceStart = Math.floor((now.getTime() - startOfSeason.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, Math.min(18, weeksSinceStart + 1))
}

export function ProjectionsProvider({ children }: { children: ReactNode }) {
  const [projections, setProjections] = useState<Map<string, PlayerProjection>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loadingPromise, setLoadingPromise] = useState<Promise<void> | null>(null)

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

  const loadProjectionsForPlayers = useCallback(
    async (playerIds: string[], playerNames?: Map<string, string>): Promise<void> => {
      // Prevent multiple simultaneous calls
      if (loadingPromise) {
        return loadingPromise
      }

      // Check if we have recent data
      if (lastUpdated && Date.now() - lastUpdated.getTime() < CACHE_DURATION) {
        return Promise.resolve()
      }

      if (playerIds.length === 0) {
        return Promise.resolve()
      }

      const promise = (async () => {
        setIsLoading(true)

        try {
          console.log(`Loading projections for ${playerIds.length} players`)

          let aiService: AIRankingsService
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

          const newProjections = new Map<string, PlayerProjection>()

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

          setProjections(newProjections)
          setLastUpdated(new Date())

          console.log(`Loaded projections for ${newProjections.size} players`)
        } catch (error) {
          console.error("Error loading projections:", error)
        } finally {
          setIsLoading(false)
          setLoadingPromise(null)
        }
      })()

      setLoadingPromise(promise)
      return promise
    },
    [lastUpdated, loadingPromise],
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
