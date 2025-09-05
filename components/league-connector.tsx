"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, Calendar, X, Trash2 } from "lucide-react"
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
  const [groupedLeagues, setGroupedLeagues] = useState<GroupedLeague[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const { setItem, removeItem, getItem } = useSafeLocalStorage()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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
      const grouped = groupLeaguesByName(userLeagues)
      setGroupedLeagues(grouped)

      setItem("sleeper_user", JSON.stringify(userData))
      setItem("sleeper_leagues", JSON.stringify(userLeagues))
      setItem("sleeper_connection_time", new Date().toISOString())
      console.log(`Saved user data and ${userLeagues.length} leagues to localStorage`)

      if (onLeaguesConnected) {
        onLeaguesConnected(userData, userLeagues)
      }

      if (userLeagues.length === 0) {
        setError(
          "User found but no leagues discovered. This might be because:\n• You don't have any leagues in recent seasons (2022-2025)\n• Your leagues are private\n• There's an API issue\n• Dynasty league data might still be updating",
        )
      }
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === "AbortError") {
        setError("Request timed out. Please try again.")
      } else if (error.message?.includes("Load failed")) {
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
    setGroupedLeagues([])
    setUsername("")
    setError(null)
    removeItem("sleeper_user")
    removeItem("sleeper_leagues")
    removeItem("sleeper_connection_time")
  }

  const removeLeague = (leagueId: string, leagueName?: string) => {
    // Add confirmation dialog
    const leagueInfo = leagueName ? `"${leagueName}"` : "this league"
    if (!confirm(`Are you sure you want to remove ${leagueInfo}? This action cannot be undone.`)) {
      return
    }
    
    try {
      // Get current leagues from localStorage
      const savedLeagues = getItem("sleeper_leagues")
      if (savedLeagues) {
        const allLeagues = JSON.parse(savedLeagues) as SleeperLeague[]
        const filteredLeagues = allLeagues.filter(league => league.league_id !== leagueId)
        
        // Update localStorage
        setItem("sleeper_leagues", JSON.stringify(filteredLeagues))
        
        // Update local state
        const newGroupedLeagues = groupLeaguesByName(filteredLeagues)
        setGroupedLeagues(newGroupedLeagues)
        
        // Notify parent component if callback exists
        if (onLeaguesConnected && user) {
          onLeaguesConnected(user, filteredLeagues)
        }
        
        console.log(`Removed league ${leagueId}. Remaining leagues: ${filteredLeagues.length}`)
      }
    } catch (error) {
      console.error("Error removing league:", error)
      setError("Failed to remove league. Please try again.")
    }
  }

  const removeEntireLeagueGroup = (leagueName: string) => {
    // Add confirmation dialog
    if (!confirm(`Are you sure you want to remove all seasons of "${leagueName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      // Get current leagues from localStorage
      const savedLeagues = getItem("sleeper_leagues")
      if (savedLeagues) {
        const allLeagues = JSON.parse(savedLeagues) as SleeperLeague[]
        const filteredLeagues = allLeagues.filter(league => league.name !== leagueName)
        
        // Update localStorage
        setItem("sleeper_leagues", JSON.stringify(filteredLeagues))
        
        // Update local state
        const newGroupedLeagues = groupLeaguesByName(filteredLeagues)
        setGroupedLeagues(newGroupedLeagues)
        
        // Notify parent component if callback exists
        if (onLeaguesConnected && user) {
          onLeaguesConnected(user, filteredLeagues)
        }
        
        console.log(`Removed league group "${leagueName}". Remaining leagues: ${filteredLeagues.length}`)
      }
    } catch (error) {
      console.error("Error removing league group:", error)
      setError("Failed to remove league group. Please try again.")
    }
  }

  if (user && groupedLeagues.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Connected Successfully
          </CardTitle>
          <CardDescription>
            Found {groupedLeagues.length} unique league{groupedLeagues.length !== 1 ? "s" : ""} for{" "}
            {user.display_name || user.username}
            <br />
            <span className="text-sm text-primary">Defaulting to 2025 season where available</span>
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
                      <p className="text-sm text-muted-foreground">
                        {selectedLeague.total_rosters} teams • {selectedLeague.status}
                        {selectedLeague.settings.max_keepers && selectedLeague.settings.max_keepers > 0 && (
                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {selectedLeague.settings.max_keepers === selectedLeague.settings.num_teams
                              ? "Dynasty"
                              : "Keeper"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEntireLeagueGroup(group.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={`Remove all seasons of "${group.name}"`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {group.seasons.length > 1 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Multiple seasons available - you can remove individual seasons:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.seasons.map((league) => (
                          <div key={league.league_id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                            <span>{league.season}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLeague(league.league_id, `${group.name} (${league.season})`)}
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                              title={`Remove ${league.season} season`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
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
          <span className="text-sm text-primary font-medium">Now checking 2025 season data first!</span>
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
