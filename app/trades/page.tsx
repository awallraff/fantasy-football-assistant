"use client"

import { useState, useEffect } from "react"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, TrendingUp, Users, Target } from "lucide-react"
import Link from "next/link"
import { TradeHistory } from "@/components/trade-history"
import { TradeEvaluator } from "@/components/trade-evaluator"
import { MarketTrends } from "@/components/market-trends"
import { OpponentAnalysis } from "@/components/opponent-analysis"
import { ErrorDisplay } from "@/components/ui/error-display"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

export default function TradesPage() {
  const [user, setUser] = useState<SleeperUser | null>(null)
  const [leagues, setLeagues] = useState<SleeperLeague[]>([])
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { getItem, isClient } = useSafeLocalStorage()

  // Load data from localStorage
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
        console.error("Failed to load trade data:", e)
        setLoadError(e instanceof Error ? e.message : "Failed to load saved league data")
      }
    }
  }, [isClient, getItem])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Trade Analysis</h1>
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

  if (!user || leagues.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No leagues connected</p>
                <Button asChild>
                  <Link href="/">Connect Account</Link>
                </Button>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade Analysis</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Analyze trade patterns, evaluate proposals, and track market trends
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={selectedLeague?.league_id || ""}
              onValueChange={(value) => {
                const league = leagues.find((l) => l.league_id === value)
                setSelectedLeague(league || null)
              }}
            >
              <SelectTrigger className="w-64">
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
            <Button asChild variant="outline">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Traders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Per Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Market Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedLeague && (
          <Tabs defaultValue="history" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">Trade History</TabsTrigger>
              <TabsTrigger value="evaluator">Trade Evaluator</TabsTrigger>
              <TabsTrigger value="trends">Market Trends</TabsTrigger>
              <TabsTrigger value="opponents">Opponent Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <TradeHistory leagueId={selectedLeague.league_id} userId={user.user_id} />
            </TabsContent>

            <TabsContent value="evaluator">
              <TradeEvaluator league={selectedLeague} />
            </TabsContent>

            <TabsContent value="trends">
              <MarketTrends leagueId={selectedLeague.league_id} />
            </TabsContent>

            <TabsContent value="opponents">
              <OpponentAnalysis leagueId={selectedLeague.league_id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
