"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { sleeperAPI, type SleeperUser, type SleeperLeague } from "@/lib/sleeper-api"

interface LeagueConnectorProps {
  onLeaguesConnected?: (user: SleeperUser, leagues: SleeperLeague[]) => void
}

export function LeagueConnector({ onLeaguesConnected }: LeagueConnectorProps) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { setItem } = useSafeLocalStorage()

  // Cleanup on unmount
  useEffect(() => {
    const controller = abortControllerRef.current;
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, []);


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
