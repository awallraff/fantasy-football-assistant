import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSafeLocalStorage } from '@/hooks/use-local-storage'
import type { RankingSystem } from '@/lib/rankings-types'
import { debugLog, debugError } from '@/lib/debug-utils'

/**
 * Type for ranking source selection
 */
export type RankingSource = "all" | "user" | "ai"

/**
 * Return type for the useRankingsState hook
 */
export interface UseRankingsStateReturn {
  // User imported ranking systems
  userRankingSystems: RankingSystem[]
  setUserRankingSystems: (systems: RankingSystem[]) => void

  // AI generated ranking system
  aiRankingSystem: RankingSystem | null
  setAiRankingSystem: (system: RankingSystem | null) => void

  // Selected ranking system
  selectedSystem: RankingSystem | null
  setSelectedSystem: (system: RankingSystem | null) => void

  // Selected source filter
  selectedSource: RankingSource
  setSelectedSource: (source: RankingSource) => void

  // Get all systems for the current or specified source
  getAllSystems: () => RankingSystem[]
  getAllSystemsForSource: (source: RankingSource) => RankingSystem[]

  // System management actions
  handleImportComplete: (newSystem: RankingSystem) => void
  handleDeleteSystem: (systemId: string) => void
  handleUpdateSystem: (updatedSystem: RankingSystem) => void
}

/**
 * Custom hook for managing ranking systems state.
 *
 * This hook encapsulates:
 * - User imported ranking systems (from localStorage)
 * - AI generated ranking system
 * - Selected system and source state
 * - System management operations (add, update, delete)
 * - Auto-selection logic when switching sources
 *
 * @example
 * ```tsx
 * const {
 *   userRankingSystems,
 *   selectedSystem,
 *   getAllSystems,
 *   handleImportComplete
 * } = useRankingsState()
 * ```
 */
export function useRankingsState(): UseRankingsStateReturn {
  const [userRankingSystems, setUserRankingSystems] = useState<RankingSystem[]>([])
  const [aiRankingSystem, setAiRankingSystem] = useState<RankingSystem | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<RankingSystem | null>(null)
  const [selectedSource, setSelectedSource] = useState<RankingSource>("ai")

  const { getItem, setItem, isClient } = useSafeLocalStorage()

  // Load user ranking systems from localStorage on mount
  useEffect(() => {
    if (!isClient) return

    const saved = getItem("ranking_systems")
    if (saved) {
      try {
        const systems = JSON.parse(saved)
        setUserRankingSystems(systems)
        debugLog("Loaded ranking systems from localStorage:", systems)
      } catch (e) {
        debugError("Failed to load rankings:", e)
      }
    }
  }, [isClient, getItem])

  /**
   * Get all ranking systems for the current selected source
   */
  const getAllSystems = useCallback((): RankingSystem[] => {
    switch (selectedSource) {
      case "user":
        return userRankingSystems
      case "ai":
        return aiRankingSystem ? [aiRankingSystem] : []
      default:
        return [...userRankingSystems]
    }
  }, [selectedSource, userRankingSystems, aiRankingSystem])

  /**
   * Get all ranking systems for a specific source (without changing state)
   */
  const getAllSystemsForSource = useCallback((source: RankingSource): RankingSystem[] => {
    switch (source) {
      case "user":
        return userRankingSystems
      case "ai":
        return aiRankingSystem ? [aiRankingSystem] : []
      default:
        return [...userRankingSystems]
    }
  }, [userRankingSystems, aiRankingSystem])

  /**
   * Auto-select system when switching sources and systems are available
   * If no system is selected but systems are available for the current source,
   * auto-select the most recent one
   */
  useEffect(() => {
    const availableSystems = getAllSystems()

    // If no system is selected but systems are available for the current source, auto-select the most recent
    if (!selectedSystem && availableSystems.length > 0) {
      const mostRecentSystem = availableSystems.reduce((latest, current) => {
        const latestTime = new Date(latest.updatedAt || latest.createdAt || 0).getTime()
        const currentTime = new Date(current.updatedAt || current.createdAt || 0).getTime()
        return currentTime > latestTime ? current : latest
      })
      setSelectedSystem(mostRecentSystem)
    }

    // If selected system doesn't belong to current source, clear selection
    if (selectedSystem && !availableSystems.some(sys => sys.id === selectedSystem.id)) {
      setSelectedSystem(null)
    }
  }, [selectedSource, userRankingSystems, aiRankingSystem, selectedSystem])

  /**
   * Handle import of new ranking system
   */
  const handleImportComplete = useCallback((newSystem: RankingSystem) => {
    debugLog("Import complete, new system:", newSystem)
    const updatedSystems = [...userRankingSystems, newSystem]
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    debugLog("Saved to localStorage:", JSON.stringify(updatedSystems))
    setSelectedSystem(newSystem)
  }, [userRankingSystems, setItem])

  /**
   * Handle deletion of a ranking system
   */
  const handleDeleteSystem = useCallback((systemId: string) => {
    const updatedSystems = userRankingSystems.filter((s) => s.id !== systemId)
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))

    // If deleted system was selected, auto-select first available system
    if (selectedSystem?.id === systemId) {
      const allSystems = selectedSource === "user" ? updatedSystems : getAllSystems()
      setSelectedSystem(allSystems[0] || null)
    }
  }, [userRankingSystems, selectedSystem, selectedSource, setItem, getAllSystems])

  /**
   * Handle update of an existing ranking system
   */
  const handleUpdateSystem = useCallback((updatedSystem: RankingSystem) => {
    const updatedSystems = userRankingSystems.map((s) =>
      s.id === updatedSystem.id ? updatedSystem : s
    )
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))

    // If updated system was selected, update the selection
    if (selectedSystem?.id === updatedSystem.id) {
      setSelectedSystem(updatedSystem)
    }
  }, [userRankingSystems, selectedSystem, setItem])

  return {
    // State
    userRankingSystems,
    setUserRankingSystems,
    aiRankingSystem,
    setAiRankingSystem,
    selectedSystem,
    setSelectedSystem,
    selectedSource,
    setSelectedSource,

    // Computed
    getAllSystems,
    getAllSystemsForSource,

    // Actions
    handleImportComplete,
    handleDeleteSystem,
    handleUpdateSystem,
  }
}
