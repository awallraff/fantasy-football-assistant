"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react"
import type { SleeperPlayer } from "@/lib/sleeper-api"
import sleeperAPI from "@/lib/sleeper-api"
import { formatPlayerName, normalizePosition } from "@/lib/player-utils"
import { sleeperCache } from "@/lib/cache/sleeper-cache"
// Phase 2 optimization: Lazy-load IndexedDB cache to defer heavy DB code
// import { indexedDBCache } from "@/lib/cache/indexeddb-cache"

// Load debug utilities only in development (Phase 1 optimization)
if (process.env.NODE_ENV !== "production") {
  import("@/lib/cache/cache-debug") // Initialize debug utilities
  import("@/lib/cache/indexeddb-debug") // Initialize IndexedDB debug utilities
}

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

      // Phase 2 optimization: Lazy-load IndexedDB cache
      const { indexedDBCache } = await import("@/lib/cache/indexeddb-cache")

      // Phase 2 optimization: Check caches in parallel instead of sequential
      // This reduces latency by running IndexedDB and sessionStorage checks simultaneously
      const [indexedPlayers, sessionPlayers] = await Promise.all([
        // Try IndexedDB (with error handling)
        indexedDBCache.isAvailable()
          ? indexedDBCache.getAllPlayers().catch((err) => {
              console.warn("[PlayerData] IndexedDB error:", err)
              return null
            })
          : Promise.resolve(null),
        // Try sessionStorage (synchronous, wrapped in Promise)
        Promise.resolve(sleeperCache.get("allPlayers", "nfl")),
      ])

      // Use IndexedDB if available
      if (indexedPlayers) {
        console.log(
          `[PlayerData] ✅ Loaded ${Object.keys(indexedPlayers).length} players from IndexedDB cache`
        )
        setPlayers(indexedPlayers)
        setIsLoading(false)
        return
      }

      // Fall back to sessionStorage
      if (sessionPlayers) {
        console.log(
          `[PlayerData] ✅ Loaded ${Object.keys(sessionPlayers).length} players from sessionStorage cache`
        )
        setPlayers(sessionPlayers)
        setIsLoading(false)

        // Background: Try to populate IndexedDB for next time
        if (indexedDBCache.isAvailable()) {
          indexedDBCache.setPlayers(sessionPlayers).catch((err) => {
            console.warn("[PlayerData] Failed to populate IndexedDB in background:", err)
          })
        }

        return
      }

      // Cache miss - fetch from API
      console.log("[PlayerData] All caches missed - fetching from Sleeper API...")
      const startTime = Date.now()

      const playerData = await sleeperAPI.getAllPlayers("nfl")
      const loadTime = Date.now() - startTime

      console.log(`[PlayerData] ✅ Loaded ${Object.keys(playerData).length} players from API (${loadTime}ms)`)

      // Save to both caches (best effort, don't fail if caching fails)
      // Try IndexedDB first
      if (indexedDBCache.isAvailable()) {
        try {
          const indexedSuccess = await indexedDBCache.setPlayers(playerData)
          if (indexedSuccess) {
            console.log("[PlayerData] ✅ Players cached to IndexedDB for 24 hours")
          } else {
            console.warn("[PlayerData] ⚠️ Failed to cache to IndexedDB, trying sessionStorage...")
            const sessionSuccess = sleeperCache.set("allPlayers", playerData, "nfl")
            if (sessionSuccess) {
              console.log("[PlayerData] ✅ Players cached to sessionStorage for 24 hours")
            }
          }
        } catch (indexedError) {
          console.warn("[PlayerData] IndexedDB caching error, falling back to sessionStorage:", indexedError)
          sleeperCache.set("allPlayers", playerData, "nfl")
        }
      } else {
        // IndexedDB not available, use sessionStorage
        const sessionSuccess = sleeperCache.set("allPlayers", playerData, "nfl")
        if (sessionSuccess) {
          console.log("[PlayerData] ✅ Players cached to sessionStorage for 24 hours")
        } else {
          console.warn("[PlayerData] ⚠️ Failed to cache player data")
        }
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

  // Phase 1 optimization: Run migration in background (non-blocking)
  // Phase 2 optimization: Also lazy-load the migration module
  useEffect(() => {
    import("@/lib/cache/cache-migration").then(({ cacheMigration }) => {
      cacheMigration.autoMigrate().catch((err) => {
        console.error("[PlayerData] Background migration failed:", err)
      })
    })
  }, [])

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
