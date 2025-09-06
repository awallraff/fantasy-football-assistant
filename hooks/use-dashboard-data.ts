import { useState, useEffect, useCallback } from 'react'
import { useSafeLocalStorage } from '@/hooks/use-local-storage'
import { sleeperAPI, type SleeperLeague, type SleeperUser } from '@/lib/sleeper-api'

interface UseDashboardDataReturn {
  // State
  user: SleeperUser | null
  leagues: SleeperLeague[]
  leaguesByYear: {[year: string]: SleeperLeague[]}
  selectedYear: string
  
  // Actions
  setSelectedYear: (year: string) => void
  loadLeaguesForYear: (year: string) => Promise<SleeperLeague[]>
  removeLeague: (leagueId: string, leagueName?: string) => void
  retryConnection: () => Promise<void>
  clearAndRestart: () => void
  
  // Computed
  availableYears: string[]
  currentYearLeagues: SleeperLeague[]
}

export function useDashboardData(): UseDashboardDataReturn {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [leaguesByYear, setLeaguesByYear] = useState<{[year: string]: SleeperLeague[]}>({})
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  
  const { getItem, setItem, removeItem, isClient } = useSafeLocalStorage()

  // Initialize data from localStorage
  useEffect(() => {
    if (!isClient) return
    
    const savedUser = getItem("sleeper_user")
    const savedLeagues = getItem("sleeper_leagues")

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    }

    if (savedLeagues) {
      try {
        const leaguesData = JSON.parse(savedLeagues)
        setLeagues(leaguesData)
        
        // Organize leagues by year and set initial year
        const leaguesByYearData: {[year: string]: SleeperLeague[]} = {}
        leaguesData.forEach((league: SleeperLeague) => {
          const year = league.season
          if (!leaguesByYearData[year]) {
            leaguesByYearData[year] = []
          }
          leaguesByYearData[year].push(league)
        })
        
        setLeaguesByYear(leaguesByYearData)
        
        // Set the initial year to the most recent year with leagues
        const years = Object.keys(leaguesByYearData).sort().reverse()
        if (years.length > 0) {
          setSelectedYear(years[0])
        }
      } catch (e) {
        console.error('Failed to parse leagues data:', e)
      }
    }
  }, [isClient, getItem])

  const loadLeaguesForYear = useCallback(async (year: string): Promise<SleeperLeague[]> => {
    if (!user) return []
    
    try {
      const userLeagues = await sleeperAPI.getUserLeagues(user.user_id, "nfl", year)
      console.log(`Loaded ${userLeagues.length} leagues for ${year}`)
      
      setLeaguesByYear(prev => ({
        ...prev,
        [year]: userLeagues
      }))
      
      return userLeagues
    } catch (error) {
      console.error(`Error loading leagues for ${year}:`, error)
      return []
    }
  }, [user])

  const removeLeague = useCallback((leagueId: string, leagueName?: string) => {
    // Add confirmation dialog
    const league = leagues.find(l => l.league_id === leagueId)
    const displayName = leagueName || league?.name || "this league"
    
    if (!confirm(`Are you sure you want to remove "${displayName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      // Filter out the league from current leagues array
      const filteredLeagues = leagues.filter(league => league.league_id !== leagueId)
      
      // Update state
      setLeagues(filteredLeagues)
      
      // Reorganize leagues by year
      const leaguesByYearData: {[year: string]: SleeperLeague[]} = {}
      filteredLeagues.forEach((league: SleeperLeague) => {
        const year = league.season
        if (!leaguesByYearData[year]) {
          leaguesByYearData[year] = []
        }
        leaguesByYearData[year].push(league)
      })
      
      setLeaguesByYear(leaguesByYearData)
      
      // Update localStorage
      setItem("sleeper_leagues", JSON.stringify(filteredLeagues))
      
      console.log(`Removed league ${leagueId}. Remaining leagues: ${filteredLeagues.length}`)
    } catch (error) {
      console.error("Error removing league:", error)
    }
  }, [leagues, setItem])

  const retryConnection = useCallback(async () => {
    try {
      const savedUser = getItem("sleeper_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        
        const seasons = ["2025", "2024", "2023"]
        let allLeagues: SleeperLeague[] = []
        const leaguesByYearData: {[year: string]: SleeperLeague[]} = {}

        for (const season of seasons) {
          try {
            const userLeagues = await sleeperAPI.getUserLeagues(userData.user_id, "nfl", season)
            
            if (userLeagues && userLeagues.length > 0) {
              allLeagues = allLeagues.concat(userLeagues)
              leaguesByYearData[season] = userLeagues
            }
          } catch (seasonError) {
            console.error(`${season} season error:`, seasonError)
          }
        }

        if (allLeagues.length > 0) {
          setLeagues(allLeagues)
          setLeaguesByYear(leaguesByYearData)
          setItem("sleeper_leagues", JSON.stringify(allLeagues))
          
          // Set the initial year to the most recent year with leagues
          const years = Object.keys(leaguesByYearData).sort().reverse()
          if (years.length > 0) {
            setSelectedYear(years[0])
          }
        }
      }
    } catch (error) {
      console.error("Error retrying connection:", error)
      throw error
    }
  }, [getItem, setItem])

  const clearAndRestart = useCallback(() => {
    removeItem("sleeper_user")
    removeItem("sleeper_leagues")
    window.location.href = "/"
  }, [removeItem])

  // Computed values
  const availableYears = Object.keys(leaguesByYear).sort().reverse()
  const currentYearLeagues = leaguesByYear[selectedYear] || []

  return {
    // State
    user,
    leagues,
    leaguesByYear,
    selectedYear,
    
    // Actions
    setSelectedYear,
    loadLeaguesForYear,
    removeLeague,
    retryConnection,
    clearAndRestart,
    
    // Computed
    availableYears,
    currentYearLeagues,
  }
}
