"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import { sleeperAPI, type SleeperUser, type SleeperLeague } from "@/lib/sleeper-api"

interface LeagueConnectorProps {
  onLeaguesConnected?: (user: SleeperUser, leagues: SleeperLeague[]) => void
}

interface GroupedLeague {
  name: string
  seasons: SleeperLeague[]
  selectedSeason: string
}

export function LeagueConnector({ onLeaguesConnected }: LeagueConnectorProps) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [groupedLeagues, setGroupedLeagues] = useState<GroupedLeague[]>([])

  const groupLeaguesByName = (leagues: SleeperLeague[]): GroupedLeague[] => {
    const grouped = leagues.reduce((acc, league) => {
      const existingGroup = acc.find((group) => group.name === league.name)
      if (existingGroup) {
        existingGroup.seasons.push(league)
      } else {
        acc.push({
          name: league.name,
          seasons: [league],
          selectedSeason: "2025", // Default to 2025
        })
      }
      return acc
    }, [] as GroupedLeague[])

    // Sort seasons within each group (newest first) and set default to 2025 if available
    grouped.forEach((group) => {
      group.seasons.sort((a, b) => Number.parseInt(b.season) - Number.parseInt(a.season))
      const has2025 = group.seasons.some((league) => league.season === "2025")
      group.selectedSeason = has2025 ? "2025" : group.seasons[0].season
    })

    return grouped
  }

  const handleConnect = async () => {
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const userData = await sleeperAPI.getUser(username.trim(), { signal: controller.signal })
      if (!userData) {
        setError("User not found. Please check the username and try again.")
        return
      }

      let userLeagues: SleeperLeague[] = []
      const seasonsToTry = ["2025", "2024", "2023", "2022"]

      for (const season of seasonsToTry) {
        try {
          console.log(`Trying to fetch leagues for season ${season}...`)
          const leagues = await sleeperAPI.getUserLeagues(userData.user_id, "nfl", season, {
            signal: controller.signal,
          })
          if (leagues && leagues.length > 0) {
            userLeagues = [...userLeagues, ...leagues]
            console.log(`Found ${leagues.length} leagues in ${season} season`)
          }
        } catch (seasonError) {
          console.log(`No leagues found for ${season} season:`, seasonError)
        }
      }

      clearTimeout(timeoutId)

      setUser(userData)
      setLeagues(userLeagues)
      const grouped = groupLeaguesByName(userLeagues)
      setGroupedLeagues(grouped)

      localStorage.setItem("sleeper_user", JSON.stringify(userData))
      localStorage.setItem("sleeper_leagues", JSON.stringify(userLeagues))
      localStorage.setItem("sleeper_connection_time", new Date().toISOString())
      console.log(`Saved user data and ${userLeagues.length} leagues to localStorage`)

      if (onLeaguesConnected) {
        onLeaguesConnected(userData, userLeagues)
      }

      if (userLeagues.length === 0) {
        setError(
          "User found but no leagues discovered. This might be because:\n• You don't have any leagues in recent seasons (2022-2025)\n• Your leagues are private\n• There's an API issue\n• Dynasty league data might still be updating",
        )
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.")
      } else if (err.message?.includes("Load failed")) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError("Failed to connect to Sleeper. Please try again.")
      }
      console.error("Connection error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeasonChange = (leagueName: string, newSeason: string) => {
    setGroupedLeagues((prev) =>
      prev.map((group) => (group.name === leagueName ? { ...group, selectedSeason: newSeason } : group)),
    )
  }

  const handleReset = () => {
    setUser(null)
    setLeagues([])
    setGroupedLeagues([])
    setUsername("")
    setError(null)
    localStorage.removeItem("sleeper_user")
    localStorage.removeItem("sleeper_leagues")
    localStorage.removeItem("sleeper_connection_time")
  }

  if (user && groupedLeagues.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Connected Successfully
          </CardTitle>
          <CardDescription>
            Found {groupedLeagues.length} unique league{groupedLeagues.length !== 1 ? "s" : ""} for{" "}
            {user.display_name || user.username}
            <br />
            <span className="text-sm text-blue-600">Defaulting to 2025 season where available</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {groupedLeagues.map((group) => {
              const selectedLeague =
                group.seasons.find((league) => league.season === group.selectedSeason) || group.seasons[0]
              return (
                <div key={group.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{group.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedLeague.total_rosters} teams • {selectedLeague.status}
                        {selectedLeague.settings.max_keepers && selectedLeague.settings.max_keepers > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {selectedLeague.settings.max_keepers === selectedLeague.settings.num_teams
                              ? "Dynasty"
                              : "Keeper"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Select
                        value={group.selectedSeason}
                        onValueChange={(value) => handleSeasonChange(group.name, value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {group.seasons.map((league) => (
                            <SelectItem key={league.season} value={league.season}>
                              {league.season}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {group.seasons.length > 1 && (
                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      Available seasons: {group.seasons.map((l) => l.season).join(", ")}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Button variant="outline" onClick={handleReset} className="w-full bg-transparent">
            Connect Different User
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Sleeper Account</CardTitle>
        <CardDescription>
          Enter your Sleeper username to import your fantasy football leagues
          <br />
          <span className="text-sm text-green-600 font-medium">Now checking 2025 season data first!</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="sleeper-username">Sleeper Username</Label>
          <Input
            id="sleeper-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
        </div>

        <Button onClick={handleConnect} disabled={loading || !username.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Leagues"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
