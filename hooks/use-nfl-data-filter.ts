import { useCallback } from "react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"
import { safeString, safeNumber } from "@/lib/nfl-data-utils"

export interface UseNFLDataFilterOptions {
  selectedTeam: string
  selectedPositionFilter: string
  minFantasyPoints: string
}

export interface UseNFLDataFilterResult {
  filterWeeklyData: (data: NFLDataResponse | null) => Record<string, unknown>[]
  filterSeasonData: (data: NFLDataResponse | null) => Record<string, unknown>[]
}

/**
 * Custom hook for filtering NFL data
 * Handles filtering by team, position, and minimum fantasy points
 */
export function useNFLDataFilter({
  selectedTeam,
  selectedPositionFilter,
  minFantasyPoints,
}: UseNFLDataFilterOptions): UseNFLDataFilterResult {

  const filterWeeklyData = useCallback((data: NFLDataResponse | null): Record<string, unknown>[] => {
    if (!data?.weekly_stats || !Array.isArray(data.weekly_stats)) return []

    return data.weekly_stats.filter(stat => {
      if (!stat || typeof stat !== 'object') return false

      const statRecord = stat as unknown as Record<string, unknown>

      if (selectedTeam !== "all" && safeString(statRecord.team) !== selectedTeam) return false
      if (selectedPositionFilter !== "ALL" && safeString(statRecord.position) !== selectedPositionFilter) return false
      if (minFantasyPoints && safeNumber(statRecord.fantasy_points_ppr) < parseFloat(minFantasyPoints)) return false

      return true
    }) as unknown as Record<string, unknown>[]
  }, [selectedTeam, selectedPositionFilter, minFantasyPoints])

  const filterSeasonData = useCallback((data: NFLDataResponse | null): Record<string, unknown>[] => {
    if (!data?.aggregated_season_stats || !Array.isArray(data.aggregated_season_stats)) return []

    return data.aggregated_season_stats.filter(stat => {
      if (!stat || typeof stat !== 'object') return false

      const statRecord = stat as unknown as Record<string, unknown>

      if (selectedTeam !== "all" && safeString(statRecord.team) !== selectedTeam) return false
      if (selectedPositionFilter !== "ALL" && safeString(statRecord.position) !== selectedPositionFilter) return false
      if (minFantasyPoints && safeNumber(statRecord.fantasy_points_ppr) < parseFloat(minFantasyPoints)) return false

      return true
    }) as unknown as Record<string, unknown>[]
  }, [selectedTeam, selectedPositionFilter, minFantasyPoints])

  return {
    filterWeeklyData,
    filterSeasonData,
  }
}
