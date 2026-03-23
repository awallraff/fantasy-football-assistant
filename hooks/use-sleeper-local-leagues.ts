"use client"

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

export interface UseSleeperLocalLeaguesResult {
  user: SleeperUser | null
  leagues: SleeperLeague[]
  setLeagues: Dispatch<SetStateAction<SleeperLeague[]>>
  selectedLeague: SleeperLeague | null
  setSelectedLeague: Dispatch<SetStateAction<SleeperLeague | null>>
  loadError: string | null
  isClient: boolean
}

/**
 * Load Sleeper user + leagues from localStorage (same keys as home/dashboard).
 * Used by tools pages that need a connected account without re-fetching on every visit.
 */
export function useSleeperLocalLeagues(): UseSleeperLocalLeaguesResult {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { getItem, isClient } = useSafeLocalStorage()

  const hydrate = useCallback(() => {
    const savedUser = getItem("sleeper_user")
    const savedLeagues = getItem("sleeper_leagues")
    if (!savedUser || !savedLeagues) {
      setUser(null)
      setLeagues([])
      setSelectedLeague(null)
      setLoadError(null)
      return
    }
    try {
      setUser(JSON.parse(savedUser))
      const leagueData = JSON.parse(savedLeagues) as SleeperLeague[]
      setLeagues(leagueData)
      setSelectedLeague(leagueData.length > 0 ? leagueData[0] : null)
      setLoadError(null)
    } catch (e) {
      console.error("[useSleeperLocalLeagues] Failed to parse saved session:", e)
      setLoadError(e instanceof Error ? e.message : "Failed to load saved league data")
    }
  }, [getItem])

  useEffect(() => {
    if (!isClient) return
    hydrate()
  }, [isClient, hydrate])

  return {
    user,
    leagues,
    setLeagues,
    selectedLeague,
    setSelectedLeague,
    loadError,
    isClient,
  }
}
