"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react"
import type { SleeperPlayer } from "@/lib/sleeper-api"
import sleeperAPI from "@/lib/sleeper-api"
import { formatPlayerName, normalizePosition } from "@/lib/player-utils"
import { sleeperCache } from "@/lib/cache/sleeper-cache"
import "@/lib/cache/cache-debug" // Initialize debug utilities

interface PlayerDataContextType {
  players: { [player_id: string]: SleeperPlayer }
  isLoading: boolean
  error: string | null
  getPlayerName: (playerId: string) => string
  getPlayer: (playerId: string) => SleeperPlayer | null
  getPlayerPosition: (playerId: string) => string
  getPlayersByPosition: (position: string) => SleeperPlayer[]
  refreshPlayerData: () => Promise<void>
}

const PlayerDataContext = createContext<PlayerDataContextType | undefined>(undefined)

export { PlayerDataContext }

interface PlayerDataProviderProps {
  children: ReactNode
}

export function PlayerDataProvider({ children }: PlayerDataProviderProps) {
  const [players, setPlayers] = useState<{ [player_id: string]: SleeperPlayer }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlayerData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const cachedPlayers = sleeperCache.get("allPlayers", "nfl")

      if (cachedPlayers) {
        console.log(`[PlayerData] ✅ Loaded ${Object.keys(cachedPlayers).length} players from cache`)
        setPlayers(cachedPlayers)
        setIsLoading(false)
        return
      }

      // Cache miss - fetch from API
      console.log("[PlayerData] Cache miss - fetching from Sleeper API...")
      const startTime = Date.now()

      const playerData = await sleeperAPI.getAllPlayers("nfl")
      const loadTime = Date.now() - startTime

      console.log(`[PlayerData] ✅ Loaded ${Object.keys(playerData).length} players from API (${loadTime}ms)`)

      // Save to cache
      const cached = sleeperCache.set("allPlayers", playerData, "nfl")
      if (cached) {
        console.log("[PlayerData] ✅ Players cached successfully for 24 hours")
      } else {
        console.warn("[PlayerData] ⚠️ Failed to cache player data")
      }

      setPlayers(playerData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load player data"
      setError(errorMessage)
      console.error("[PlayerData] Error loading player data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlayerData()
  }, [loadPlayerData])

  const getPlayerName = useCallback((playerId: string): string => {
    const player = players[playerId]
    if (!player) {
      return `Player ${playerId}`
    }
    return formatPlayerName(player)
  }, [players])

  const getPlayer = useCallback((playerId: string): SleeperPlayer | null => {
    return players[playerId] || null
  }, [players])

  const getPlayerPosition = useCallback((playerId: string): string => {
    const player = players[playerId]
    if (!player) {
      return "UNKNOWN"
    }
    return normalizePosition(player.position)
  }, [players])

  const getPlayersByPosition = useCallback((position: string): SleeperPlayer[] => {
    const normalizedPosition = normalizePosition(position)
    return Object.values(players)
      .filter((player) => normalizePosition(player.position) === normalizedPosition)
      .sort((a, b) => formatPlayerName(a).localeCompare(formatPlayerName(b)))
  }, [players])

  const refreshPlayerData = useCallback(async () => {
    await loadPlayerData()
  }, [loadPlayerData])

  const value: PlayerDataContextType = useMemo(() => ({
    players,
    isLoading,
    error,
    getPlayerName,
    getPlayer,
    getPlayerPosition,
    getPlayersByPosition,
    refreshPlayerData,
  }), [players, isLoading, error, getPlayerName, getPlayer, getPlayerPosition, getPlayersByPosition, refreshPlayerData])

  return <PlayerDataContext.Provider value={value}>{children}</PlayerDataContext.Provider>
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext)
  if (context === undefined) {
    throw new Error("usePlayerData must be used within a PlayerDataProvider")
  }
  return context
}
