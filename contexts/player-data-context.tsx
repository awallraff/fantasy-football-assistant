"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { SleeperPlayer } from "@/lib/sleeper-api"
import sleeperAPI from "@/lib/sleeper-api"
import { formatPlayerName, normalizePosition } from "@/lib/player-utils"

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

  const loadPlayerData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Loading player data globally...")

      const playerData = await sleeperAPI.getAllPlayers("nfl")
      setPlayers(playerData)

      console.log(`Successfully loaded ${Object.keys(playerData).length} players globally`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load player data"
      setError(errorMessage)
      console.error("Error loading global player data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlayerData()
  }, [])

  const getPlayerName = (playerId: string): string => {
    const player = players[playerId]
    if (!player) {
      return `Player ${playerId}`
    }
    return formatPlayerName(player)
  }

  const getPlayer = (playerId: string): SleeperPlayer | null => {
    return players[playerId] || null
  }

  const getPlayerPosition = (playerId: string): string => {
    const player = players[playerId]
    if (!player) {
      return "UNKNOWN"
    }
    return normalizePosition(player.position)
  }

  const getPlayersByPosition = (position: string): SleeperPlayer[] => {
    const normalizedPosition = normalizePosition(position)
    return Object.values(players)
      .filter((player) => normalizePosition(player.position) === normalizedPosition)
      .sort((a, b) => formatPlayerName(a).localeCompare(formatPlayerName(b)))
  }

  const refreshPlayerData = async () => {
    await loadPlayerData()
  }

  const value: PlayerDataContextType = {
    players,
    isLoading,
    error,
    getPlayerName,
    getPlayer,
    getPlayerPosition,
    getPlayersByPosition,
    refreshPlayerData,
  }

  return <PlayerDataContext.Provider value={value}>{children}</PlayerDataContext.Provider>
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext)
  if (context === undefined) {
    throw new Error("usePlayerData must be used within a PlayerDataProvider")
  }
  return context
}
