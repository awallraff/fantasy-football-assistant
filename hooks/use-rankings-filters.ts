import { useState, useMemo, useCallback } from 'react'
import type { RankingSystem, PlayerRanking } from '@/lib/rankings-types'
import { usePlayerData } from '@/contexts/player-data-context'
import { normalizePosition } from '@/lib/player-utils'

/**
 * Simple player ranking interface for display
 */
export interface SimplePlayerRanking {
  rank: number
  playerId: string
  playerName: string
  position: string
  team: string
  projectedPoints?: number
  tier?: number
  notes?: string
  injuryStatus?: string
}

/**
 * Return type for the useRankingsFilters hook
 */
export interface UseRankingsFiltersReturn {
  // Filter state
  selectedPosition: string
  setSelectedPosition: (position: string) => void

  // Filtered and enriched rankings (with player data)
  filteredRankings: SimplePlayerRanking[]

  // Available positions for filtering
  availablePositions: string[]
}

/**
 * Parameters for the useRankingsFilters hook
 */
export interface UseRankingsFiltersParams {
  selectedSystem: RankingSystem | null
  allSystems: RankingSystem[]
}

/**
 * Custom hook for managing ranking filters and computing filtered results.
 *
 * This hook encapsulates:
 * - Position filter state
 * - Filtering logic with real player data enrichment
 * - Memoized filtered rankings computation
 * - Available positions extraction from all systems
 *
 * @example
 * ```tsx
 * const {
 *   selectedPosition,
 *   setSelectedPosition,
 *   filteredRankings,
 *   availablePositions
 * } = useRankingsFilters({ selectedSystem, allSystems })
 * ```
 */
export function useRankingsFilters({
  selectedSystem,
  allSystems,
}: UseRankingsFiltersParams): UseRankingsFiltersReturn {
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const { getPlayer } = usePlayerData()

  /**
   * Get all unique positions from all ranking systems
   */
  const availablePositions = useMemo(() => {
    const positions = new Set<string>()
    allSystems.forEach((system) => {
      system.positions.forEach((pos) => {
        // Only add valid, non-empty positions
        if (
          pos &&
          typeof pos === 'string' &&
          pos.trim() &&
          pos.trim() !== "UNKNOWN" &&
          pos.trim() !== "all"
        ) {
          positions.add(pos.trim())
        }
      })
    })
    return Array.from(positions)
      .filter(pos => pos && pos.trim() && pos.trim().length > 0)
      .sort()
  }, [allSystems])

  /**
   * Filter and enrich rankings with real player data
   * - Filters by selected position
   * - Enriches with player data from PlayerDataContext
   * - Converts to SimplePlayerRanking format for display
   */
  const filteredRankings = useMemo(() => {
    if (!selectedSystem) {
      return []
    }

    let rankings = selectedSystem.rankings

    // Filter by position if selected
    if (selectedPosition !== "all") {
      rankings = rankings.filter((r) => r.position === selectedPosition)
    }

    // Convert to SimplePlayerRanking format with real player data
    return rankings.map((ranking) => {
      const player = getPlayer(ranking.playerId)

      return {
        rank: ranking.rank,
        playerId: ranking.playerId,
        playerName: player
          ? player.full_name || `${player.first_name} ${player.last_name}` || "Unknown Player"
          : ranking.playerName,
        position: player ? normalizePosition(player.position) : ranking.position,
        team: player?.team || ranking.team || "FA",
        projectedPoints: ranking.projectedPoints,
        tier: ranking.tier,
        notes: ranking.notes,
        injuryStatus: player?.injury_status || "Healthy",
      }
    })
  }, [selectedSystem, selectedPosition, getPlayer])

  return {
    selectedPosition,
    setSelectedPosition,
    filteredRankings,
    availablePositions,
  }
}
