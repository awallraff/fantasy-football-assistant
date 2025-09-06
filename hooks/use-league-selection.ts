import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { sleeperAPI, type SleeperLeague, type SleeperRoster, type SleeperUser } from '@/lib/sleeper-api'

interface UseLeagueSelectionProps {
  leaguesByYear: {[year: string]: SleeperLeague[]}
  selectedYear: string
  currentUser?: SleeperUser | null
}

interface UseLeagueSelectionReturn {
  // State
  selectedLeague: SleeperLeague | null
  rosters: SleeperRoster[]
  leagueUsers: SleeperUser[]
  
  // Actions
  loadLeagueDetails: (league: SleeperLeague) => Promise<void>
  handleBackToLeagues: () => void
  handleLeagueChange: (leagueId: string) => Promise<void>
  
  // Computed
  sortedRosters: SleeperRoster[]
}

export function useLeagueSelection({ 
  leaguesByYear, 
  selectedYear, 
  currentUser 
}: UseLeagueSelectionProps): UseLeagueSelectionReturn {
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [rosters, setRosters] = useState<SleeperRoster[]>([])
  const [leagueUsers, setLeagueUsers] = useState<SleeperUser[]>([])
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadLeagueDetails = useCallback(async (league: SleeperLeague) => {
    // Clean up previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    try {
      const [rostersData, usersData] = await Promise.all([
        sleeperAPI.getLeagueRosters(league.league_id),
        sleeperAPI.getLeagueUsers(league.league_id),
      ])

      if (!controller.signal.aborted) {
        setRosters(rostersData)
        setLeagueUsers(usersData)
        setSelectedLeague(league)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error loading league details:", error)
        throw error
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [])

  const handleBackToLeagues = useCallback(() => {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setSelectedLeague(null)
    setRosters([])
    setLeagueUsers([])
  }, [])

  const handleLeagueChange = useCallback(async (leagueId: string) => {
    const currentYearLeagues = leaguesByYear[selectedYear] || []
    const league = currentYearLeagues.find(l => l.league_id === leagueId)
    
    if (league) {
      await loadLeagueDetails(league)
    }
  }, [leaguesByYear, selectedYear, loadLeagueDetails])

  // Memoize sorted rosters for performance
  const sortedRosters = useMemo(() => {
    return [...rosters].sort((a, b) => {
      const aOwner = leagueUsers.find((u) => u.user_id === a.owner_id)
      const bOwner = leagueUsers.find((u) => u.user_id === b.owner_id)

      // Put current user's team first
      if (aOwner?.user_id === currentUser?.user_id) return -1
      if (bOwner?.user_id === currentUser?.user_id) return 1

      // Keep original order for other teams
      return 0
    })
  }, [rosters, leagueUsers, currentUser?.user_id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    selectedLeague,
    rosters,
    leagueUsers,
    
    // Actions
    loadLeagueDetails,
    handleBackToLeagues,
    handleLeagueChange,
    
    // Computed
    sortedRosters,
  }
}
