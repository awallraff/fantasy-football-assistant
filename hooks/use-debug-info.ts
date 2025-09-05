import { useState, useCallback, useEffect } from 'react'
import { useSafeLocalStorage } from '@/hooks/use-local-storage'
import { sleeperAPI, type SleeperUser, type SleeperLeague } from '@/lib/sleeper-api'

interface UseDebugInfoReturn {
  debugInfo: string
  setDebugInfo: (info: string) => void
  generateInitialDebugInfo: (user: SleeperUser | null, leagues: SleeperLeague[]) => void
  generateRetryDebugInfo: () => Promise<string>
}

export function useDebugInfo(): UseDebugInfoReturn {
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { getItem } = useSafeLocalStorage()

  const generateInitialDebugInfo = useCallback((user: SleeperUser | null, leagues: SleeperLeague[]) => {
    const savedUser = getItem("sleeper_user")
    const savedLeagues = getItem("sleeper_leagues")
    
    let debug = "Debug Info:\n"
    debug += `User data exists: ${!!savedUser}\n`
    debug += `Leagues data exists: ${!!savedLeagues}\n`
    
    if (user) {
      debug += `User: ${user.display_name || user.username}\n`
    }
    
    if (leagues.length > 0) {
      // Organize leagues by year for debug info
      const leaguesByYear: {[year: string]: SleeperLeague[]} = {}
      leagues.forEach((league: SleeperLeague) => {
        const year = league.season
        if (!leaguesByYear[year]) {
          leaguesByYear[year] = []
        }
        leaguesByYear[year].push(league)
      })
      
      const years = Object.keys(leaguesByYear).sort().reverse()
      debug += `Leagues count: ${leagues.length}\n`
      debug += `Years with leagues: ${years.join(", ")}\n`
    }
    
    setDebugInfo(debug)
  }, [getItem])

  const generateRetryDebugInfo = useCallback(async (): Promise<string> => {
    let debug = "Retry Connection Debug:\n"

    try {
      const savedUser = getItem("sleeper_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        debug += `User ID: ${userData.user_id}\n`
        debug += `Username: ${userData.username}\n\n`

        const seasons = ["2025", "2024", "2023"]
        let allLeagues: SleeperLeague[] = []
        const leaguesByYearData: {[year: string]: SleeperLeague[]} = {}

        for (const season of seasons) {
          try {
            debug += `Checking ${season} season...\n`
            const userLeagues = await sleeperAPI.getUserLeagues(userData.user_id, "nfl", season)
            debug += `${season} leagues found: ${userLeagues?.length || 0}\n`

            if (userLeagues && userLeagues.length > 0) {
              debug += `${season} league names: ${userLeagues.map((l) => l.name).join(", ")}\n`
              allLeagues = allLeagues.concat(userLeagues)
              leaguesByYearData[season] = userLeagues
            }
            debug += "\n"
          } catch (seasonError) {
            debug += `${season} season error: ${seasonError}\n\n`
          }
        }

        if (allLeagues.length > 0) {
          debug += `✅ Successfully loaded ${allLeagues.length} leagues across ${Object.keys(leaguesByYearData).length} seasons`
        } else {
          debug += `❌ No leagues found in any season. This could mean:\n`
          debug += `- You don't have any fantasy leagues on Sleeper\n`
          debug += `- Your leagues are from a different season\n`
          debug += `- There's an API issue\n`
          debug += `- Your username might be different than expected`
        }
      } else {
        debug += "❌ No user data found in localStorage"
      }
    } catch (error) {
      console.error("Error generating retry debug info:", error)
      debug += `❌ Debug generation failed with error: ${error}`
    }

    return debug
  }, [getItem])

  return {
    debugInfo,
    setDebugInfo,
    generateInitialDebugInfo,
    generateRetryDebugInfo,
  }
}