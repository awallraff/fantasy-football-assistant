"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, TrendingUp, Users, Target } from "lucide-react"
import Link from "next/link"
import { ErrorDisplay } from "@/components/ui/error-display"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

// Lazy-load heavy tab components to reduce initial bundle size
const TradeHistory = dynamic(() => import("@/components/trade-history").then(mod => ({ default: mod.TradeHistory })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const TradeEvaluator = dynamic(() => import("@/components/trade-evaluator").then(mod => ({ default: mod.TradeEvaluator })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const MarketTrends = dynamic(() => import("@/components/market-trends").then(mod => ({ default: mod.MarketTrends })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const OpponentAnalysis = dynamic(() => import("@/components/opponent-analysis").then(mod => ({ default: mod.OpponentAnalysis })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-compact-lg py-compact-xl">
          <div className="animate-pulse space-y-compact-md">
            <div className="h-8 bg-muted rounded-md w-1/4"></div>
            <div className="h-4 bg-muted rounded-md w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-compact-lg py-compact-xl">
          <h1 className="text-ios-title-1 text-foreground mb-compact-md">Trade Analysis</h1>
          <ErrorDisplay
            type="validation"
            title="Failed to Load League Data"
            message={loadError}
            showRetry={true}
            onRetry={() => window.location.reload()}
            actions={
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
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
        <div className="container mx-auto px-compact-lg py-compact-xl">
          <Card className="max-w-md mx-auto bg-background-elevated shadow-md rounded-md">
            <CardContent className="pt-compact-md">
              <div className="text-center py-compact-xl">
                <p className="text-ios-body text-text-secondary mb-compact-lg">No leagues connected</p>
                <Button asChild className="min-h-[44px]">
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg py-compact-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-compact-lg mb-compact-xl">
          <div>
            <h1 className="text-ios-title-1 text-foreground mb-compact-xs">Trade Analysis</h1>
            <p className="text-ios-body text-text-secondary">
              Analyze trade patterns, evaluate proposals, and track market trends
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-compact-sm sm:gap-compact-lg">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-compact-sm md:gap-compact-md mb-compact-xl">
          <Card className="bg-background-elevated shadow-sm rounded-md border-0">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Total Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated shadow-sm rounded-md border-0">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <TrendingUp className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Active Traders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated shadow-sm rounded-md border-0">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <Users className="h-5 w-5 text-secondary shrink-0" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Avg Per Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated shadow-sm rounded-md border-0">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <Target className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Market Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedLeague && (
          <Tabs defaultValue="history" className="space-y-compact-md">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 min-h-[44px] gap-compact-xs">
              <TabsTrigger value="history" className="min-h-[44px] text-ios-body">Trade History</TabsTrigger>
              <TabsTrigger value="evaluator" className="min-h-[44px] text-ios-body">Trade Evaluator</TabsTrigger>
              <TabsTrigger value="trends" className="min-h-[44px] text-ios-body">Market Trends</TabsTrigger>
              <TabsTrigger value="opponents" className="min-h-[44px] text-ios-body">Opponent Analysis</TabsTrigger>
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
