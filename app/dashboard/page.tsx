"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, RefreshCw, BarChart3 } from "lucide-react"
import { sleeperAPI, type SleeperLeague, type SleeperUser, type SleeperRoster } from "@/lib/sleeper-api"
import { LeagueOverview } from "@/components/league-overview"
import { EnhancedTeamRoster } from "@/components/enhanced-team-roster"
import { StandingsTable } from "@/components/standings-table"
import { RecentActivity } from "@/components/recent-activity"

export default function DashboardPage() {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [rosters, setRosters] = useState<SleeperRoster[]>([])
  const [leagueUsers, setLeagueUsers] = useState<SleeperUser[]>([])
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem("sleeper_user")
    const savedLeagues = localStorage.getItem("sleeper_leagues")

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
        debug += `Leagues count: ${leaguesData.length}\n`
      } catch (e) {
        debug += `Leagues data parse error: ${e}\n`
      }
    }

    setDebugInfo(debug)
  }, [])

  const loadLeagueDetails = async (league: SleeperLeague) => {
    setLoading(true)
    try {
      const [rostersData, usersData] = await Promise.all([
        sleeperAPI.getLeagueRosters(league.league_id),
        sleeperAPI.getLeagueUsers(league.league_id),
      ])

      setRosters(rostersData)
      setLeagueUsers(usersData)
      setSelectedLeague(league)
    } catch (error) {
      console.error("Error loading league details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLeagues = () => {
    setSelectedLeague(null)
    setRosters([])
    setLeagueUsers([])
  }

  const retryConnection = async () => {
    setRetrying(true)
    let debug = "Retry Connection Debug:\n"

    try {
      const savedUser = localStorage.getItem("sleeper_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        debug += `User ID: ${userData.user_id}\n`
        debug += `Username: ${userData.username}\n\n`

        const seasons = ["2024", "2023", "2022"]
        let allLeagues: any[] = []

        for (const season of seasons) {
          try {
            debug += `Checking ${season} season...\n`
            const userLeagues = await sleeperAPI.getUserLeagues(userData.user_id, season)
            debug += `${season} leagues found: ${userLeagues?.length || 0}\n`

            if (userLeagues && userLeagues.length > 0) {
              debug += `${season} league names: ${userLeagues.map((l) => l.name).join(", ")}\n`
              if (season === "2024") {
                allLeagues = userLeagues
              }
            }
            debug += "\n"
          } catch (seasonError) {
            debug += `${season} season error: ${seasonError}\n\n`
          }
        }

        if (allLeagues.length > 0) {
          setLeagues(allLeagues)
          localStorage.setItem("sleeper_leagues", JSON.stringify(allLeagues))
          debug += `✅ Successfully loaded ${allLeagues.length} leagues from 2024 season`
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
    localStorage.removeItem("sleeper_user")
    localStorage.removeItem("sleeper_leagues")
    window.location.href = "/"
  }

  if (!user || leagues.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>No Leagues Connected</CardTitle>
              <CardDescription>{!user ? "No user data found" : "No leagues found for your account"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono whitespace-pre-line">
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
                  <a href="/">Back to Home</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (selectedLeague) {
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedLeague.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedLeague.total_rosters} teams • {selectedLeague.season} season
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => loadLeagueDetails(selectedLeague)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
                  {rosters
                    .sort((a, b) => {
                      const aOwner = leagueUsers.find((u) => u.user_id === a.owner_id)
                      const bOwner = leagueUsers.find((u) => u.user_id === b.owner_id)

                      // Put current user's team first
                      if (aOwner?.user_id === user?.user_id) return -1
                      if (bOwner?.user_id === user?.user_id) return 1

                      // Keep original order for other teams
                      return 0
                    })
                    .map((roster) => {
                      const owner = leagueUsers.find((u) => u.user_id === roster.owner_id)
                      if (!owner) return null

                      return (
                        <EnhancedTeamRoster
                          key={roster.roster_id}
                          roster={roster}
                          user={owner}
                          leagueId={selectedLeague.league_id}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Select a league to view detailed analytics and insights</p>
        </div>

        {/* Leagues Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Card key={league.league_id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{league.name}</CardTitle>
                  <Badge variant={league.status === "in_season" ? "default" : "secondary"}>
                    {league.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription>
                  {league.total_rosters} teams • {league.season} season
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sport</span>
                    <span className="font-medium uppercase">{league.sport}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Season Type</span>
                    <span className="font-medium">{league.season_type}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={() => loadLeagueDetails(league)} disabled={loading}>
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
      </div>
    </div>
  )
}
