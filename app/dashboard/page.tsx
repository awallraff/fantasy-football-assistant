"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, RefreshCw, BarChart3, Trash2 } from "lucide-react"
import Link from "next/link"
import { sleeperAPI, type SleeperLeague, type SleeperUser, type SleeperRoster } from "@/lib/sleeper-api"
import { LeagueOverview } from "@/components/league-overview"
import { EnhancedTeamRoster } from "@/components/enhanced-team-roster"
import { StandingsTable } from "@/components/standings-table"
import { RecentActivity } from "@/components/recent-activity"

export default function DashboardPage() {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [leaguesByYear, setLeaguesByYear] = useState<{[year: string]: SleeperLeague[]}>({})
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  const [rosters, setRosters] = useState<SleeperRoster[]>([])
  const [leagueUsers, setLeagueUsers] = useState<SleeperUser[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [retrying, setRetrying] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { getItem, setItem, removeItem, isClient } = useSafeLocalStorage()

  useEffect(() => {
    if (!isClient) return
    
    const savedUser = getItem("sleeper_user")
    const savedLeagues = getItem("sleeper_leagues")

    let debug = "Debug Info:\n"
    debug += `User data exists: ${!!savedUser}\n`
    debug += `Leagues data exists: ${!!savedLeagues}\n`

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        debug += `User: ${userData.display_name || userData.username}\n`
      } catch (e) {
        debug += `User data parse error: ${e}\n`
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
        
        debug += `Leagues count: ${leaguesData.length}\n`
        debug += `Years with leagues: ${years.join(", ")}\n`
      } catch (e) {
        debug += `Leagues data parse error: ${e}\n`
      }
    }

    setDebugInfo(debug)
  }, [isClient, getItem])

  const loadLeaguesForYear = useCallback(async (year: string) => {
    if (!user) return []
    
    setLoadingYears(true)
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
    } finally {
      setLoadingYears(false)
    }
  }, [user])

  const loadLeagueDetails = useCallback(async (league: SleeperLeague) => {
    setLoading(true)
    
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
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
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

  const handleYearChange = useCallback(async (year: string) => {
    setSelectedYear(year)
    
    // Load leagues for this year if not already loaded
    if (!leaguesByYear[year]) {
      await loadLeaguesForYear(year)
    }
  }, [leaguesByYear, loadLeaguesForYear])

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
      if (aOwner?.user_id === user?.user_id) return -1
      if (bOwner?.user_id === user?.user_id) return 1

      // Keep original order for other teams
      return 0
    })
  }, [rosters, leagueUsers, user?.user_id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const retryConnection = async () => {
    setRetrying(true)
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
          setLeagues(allLeagues)
          setLeaguesByYear(leaguesByYearData)
          setItem("sleeper_leagues", JSON.stringify(allLeagues))
          
          // Set the initial year to the most recent year with leagues
          const years = Object.keys(leaguesByYearData).sort().reverse()
          if (years.length > 0) {
            setSelectedYear(years[0])
          }
          
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
      console.error("Error retrying connection:", error)
      debug += `❌ Retry failed with error: ${error}`
    } finally {
      setDebugInfo(debug)
      setRetrying(false)
    }
  }

  const clearAndRestart = () => {
    removeItem("sleeper_user")
    removeItem("sleeper_leagues")
    window.location.href = "/"
  }

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
      
      // If the removed league was the currently selected one, clear selection
      if (selectedLeague?.league_id === leagueId) {
        handleBackToLeagues()
      }
      
      console.log(`Removed league ${leagueId}. Remaining leagues: ${filteredLeagues.length}`)
    } catch (error) {
      console.error("Error removing league:", error)
    }
  }, [leagues, selectedLeague, setItem, handleBackToLeagues])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || leagues.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>No Leagues Connected</CardTitle>
              <CardDescription>{!user ? "No user data found" : "No leagues found for your account"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-line text-muted-foreground">
                {debugInfo}
              </div>

              <div className="flex flex-col gap-2">
                {user && (
                  <Button onClick={retryConnection} disabled={retrying} className="w-full">
                    {retrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Fetching Leagues
                      </>
                    )}
                  </Button>
                )}

                <Button variant="outline" onClick={clearAndRestart} className="w-full bg-transparent">
                  Start Fresh
                </Button>

                <Button asChild className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (selectedLeague) {
    const currentYearLeagues = leaguesByYear[selectedYear] || []
    const availableLeagueYears = Object.keys(leaguesByYear).sort().reverse()
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToLeagues}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leagues
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{selectedLeague.name}</h1>
                <p className="text-muted-foreground">
                  {selectedLeague.total_rosters} teams • {selectedLeague.season} season
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* League/Year Switcher */}
              <div className="flex items-center gap-2">
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeagueYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedLeague.league_id} onValueChange={handleLeagueChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentYearLeagues.map(league => (
                      <SelectItem key={league.league_id} value={league.league_id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="h-6 w-px bg-border"></div>
              
              <Button variant="outline" onClick={() => loadLeagueDetails(selectedLeague)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <LeagueOverview league={selectedLeague} rosters={rosters} users={leagueUsers} />
            </TabsContent>

            <TabsContent value="teams">
              <div className="grid gap-6">
                <div className="space-y-4">
                  {sortedRosters.map((roster) => {
                      const owner = leagueUsers.find((u) => u.user_id === roster.owner_id)
                      if (!owner) return null

                      return (
                        <EnhancedTeamRoster
                          key={roster.roster_id}
                          roster={roster}
                          user={owner}
                          isCurrentUser={owner.user_id === user?.user_id}
                        />
                      )
                    })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="standings">
              <StandingsTable rosters={rosters} users={leagueUsers} league={selectedLeague} />
            </TabsContent>

            <TabsContent value="activity">
              <RecentActivity leagueId={selectedLeague.league_id} users={leagueUsers} rosters={rosters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  const currentYearLeagues = leaguesByYear[selectedYear] || []
  const availableLeagueYears = Object.keys(leaguesByYear).sort().reverse()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-muted-foreground">Select a league to view detailed analytics and insights</p>
          
          {/* Year Selector */}
          {availableLeagueYears.length > 1 && (
            <div className="flex justify-center mt-4">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLeagueYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingYears && (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading leagues for {selectedYear}...</p>
          </div>
        )}

        {/* Leagues Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentYearLeagues.map((league) => (
            <Card key={league.league_id} className="hover:shadow-lg transition-shadow border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-card-foreground">{league.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={league.status === "in_season" ? "default" : "secondary"}>
                      {league.status.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLeague(league.league_id, `${league.name} (${league.season})`)
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={`Remove "${league.name}" from your leagues`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {league.total_rosters} teams • {league.season} season
                </CardDescription>
              </CardHeader>
              <CardContent className="cursor-pointer" onClick={() => loadLeagueDetails(league)}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sport</span>
                    <span className="font-medium uppercase text-foreground">{league.sport}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Season Type</span>
                    <span className="font-medium text-foreground">{league.season_type}</span>
                  </div>
                  <Button className="w-full mt-4" disabled={loading} onClick={(e) => {
                    e.stopPropagation()
                    loadLeagueDetails(league)
                  }}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* No Leagues Message */}
        {!loadingYears && currentYearLeagues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No leagues found for {selectedYear} season
            </p>
            {availableLeagueYears.length > 1 && (
              <p className="text-sm text-muted-foreground">
                Try selecting a different year above
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
