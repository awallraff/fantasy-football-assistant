"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Target, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { ErrorDisplay, categorizeError } from "@/components/ui/error-display"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"
import { sleeperAPI } from "@/lib/sleeper-api"

// Lazy-load heavy tab components to reduce initial bundle size
const TradeRecommendations = dynamic(() => import("@/components/trade-recommendations").then(mod => ({ default: mod.TradeRecommendations })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const LineupOptimizer = dynamic(() => import("@/components/lineup-optimizer").then(mod => ({ default: mod.LineupOptimizer })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const WaiverWireAnalyzer = dynamic(() => import("@/components/waiver-wire-analyzer").then(mod => ({ default: mod.WaiverWireAnalyzer })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const StartSitAdvisor = dynamic(() => import("@/components/start-sit-advisor").then(mod => ({ default: mod.StartSitAdvisor })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const StrategicInsights = dynamic(() => import("@/components/strategic-insights").then(mod => ({ default: mod.StrategicInsights })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

export default function RecommendationsPage() {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<string>("2025")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<{ message: string; error: unknown } | null>(null)
  const { getItem, setItem, isClient } = useSafeLocalStorage()

  useEffect(() => {
    if (!isClient) return

    const savedUser = getItem("sleeper_user")
    const savedLeagues = getItem("sleeper_leagues")

    if (savedUser && savedLeagues) {
      try {
        setUser(JSON.parse(savedUser))
        const leagueData = JSON.parse(savedLeagues)
        setLeagues(leagueData)
        if (leagueData.length > 0) {
          setSelectedLeague(leagueData[0])
        }
        setLoadError(null)
      } catch (e) {
        console.error("Failed to load recommendations data:", e)
        setLoadError(e instanceof Error ? e.message : "Failed to load saved league data")
      }
    }
  }, [isClient, getItem])

  const refreshLeaguesForSeason = async (season: string) => {
    if (!user) return

    setApiError(null)
    try {
      const seasonLeagues = await sleeperAPI.getUserLeagues(user.user_id, "nfl", season)
      setLeagues(seasonLeagues)
      if (seasonLeagues.length > 0) {
        setSelectedLeague(seasonLeagues[0])
      } else {
        setSelectedLeague(null)
      }
      setItem("sleeper_leagues", JSON.stringify(seasonLeagues))
    } catch (error) {
      console.error("Error fetching leagues for season:", error)
      setApiError({
        message: error instanceof Error ? error.message : "Failed to fetch leagues for selected season",
        error
      })
    }
  }

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season)
    refreshLeaguesForSeason(season)
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">AI Recommendations</h1>
          <ErrorDisplay
            type="validation"
            title="Failed to Load League Data"
            message={loadError}
            showRetry={true}
            onRetry={() => window.location.reload()}
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/">Return Home</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">AI Recommendations</h1>
          <ErrorDisplay
            type={categorizeError(apiError.error)}
            title="Failed to Fetch League Data"
            message={apiError.message}
            showRetry={true}
            onRetry={() => refreshLeaguesForSeason(selectedSeason)}
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/">Return Home</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (!user || leagues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No leagues connected for {selectedSeason} season</p>
                <div className="space-y-4">
                  <Select value={selectedSeason} onValueChange={handleSeasonChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025 Season</SelectItem>
                      <SelectItem value="2024">2024 Season</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild>
                    <Link href="/">Connect Account</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
              Smart suggestions for trades, lineups, and strategic decisions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Select value={selectedSeason} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedLeague?.league_id || ""}
              onValueChange={(value) => {
                const league = leagues.find((l) => l.league_id === value)
                setSelectedLeague(league || null)
              }}
            >
              <SelectTrigger className="w-full sm:w-64 min-h-[44px]">
                <SelectValue placeholder="Select League" />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((league) => (
                  <SelectItem key={league.league_id} value={league.league_id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="min-h-[44px]">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">8.5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Projected Points Gain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trade Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedLeague && (
          <Tabs defaultValue="trades" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 min-h-[44px]">
              <TabsTrigger value="trades" className="min-h-[44px]">Trade Recs</TabsTrigger>
              <TabsTrigger value="lineup" className="min-h-[44px]">Lineup</TabsTrigger>
              <TabsTrigger value="waiver" className="min-h-[44px]">Waiver Wire</TabsTrigger>
              <TabsTrigger value="startsit" className="min-h-[44px]">Start/Sit</TabsTrigger>
              <TabsTrigger value="insights" className="min-h-[44px]">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="trades">
              <TradeRecommendations league={selectedLeague} userId={user.user_id} season={selectedSeason} />
            </TabsContent>

            <TabsContent value="lineup">
              <LineupOptimizer league={selectedLeague} userId={user.user_id} />
            </TabsContent>

            <TabsContent value="waiver">
              <WaiverWireAnalyzer league={selectedLeague} />
            </TabsContent>

            <TabsContent value="startsit">
              <StartSitAdvisor league={selectedLeague} userId={user.user_id} />
            </TabsContent>

            <TabsContent value="insights">
              <StrategicInsights league={selectedLeague} userId={user.user_id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
