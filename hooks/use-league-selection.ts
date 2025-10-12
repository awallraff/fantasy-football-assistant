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
        // Set data atomically to avoid timing issues
        // This ensures rosters and users are always in sync
        setSelectedLeague(league)
        setRosters(rostersData)
        setLeagueUsers(usersData)

        // Debug logging for data mismatch issues
        if (process.env.NODE_ENV === 'development') {
          console.log(`Loaded league ${league.name}:`, {
            rostersCount: rostersData.length,
            usersCount: usersData.length,
            rosterOwnerIds: rostersData.map(r => r.owner_id),
            userIds: usersData.map(u => u.user_id),
          })
        }
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
    // If no league users loaded yet, return empty array
    if (leagueUsers.length === 0) {
      if (rosters.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('Rosters loaded but no league users available yet')
      }
      return []
    }

    // Only include rosters that have a matching owner in leagueUsers
    const rostersWithOwners = rosters.filter(roster => {
      const hasOwner = leagueUsers.some(u => u.user_id === roster.owner_id)
      if (!hasOwner && process.env.NODE_ENV === 'development') {
        console.warn(`Roster ${roster.roster_id} has no matching owner. owner_id: ${roster.owner_id}`)
        console.warn('Available user IDs:', leagueUsers.map(u => u.user_id))
      }
      return hasOwner
    })

    // Sort filtered rosters - current user first
    return [...rostersWithOwners].sort((a, b) => {
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
