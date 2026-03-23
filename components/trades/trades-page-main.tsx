"use client"

import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, TrendingUp, Users, Target } from "lucide-react"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

const TradeHistory = dynamic(
  () => import("@/components/trade-history").then((mod) => ({ default: mod.TradeHistory })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const TradeEvaluator = dynamic(
  () => import("@/components/trade-evaluator").then((mod) => ({ default: mod.TradeEvaluator })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const MarketTrends = dynamic(
  () => import("@/components/market-trends").then((mod) => ({ default: mod.MarketTrends })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const OpponentAnalysis = dynamic(
  () => import("@/components/opponent-analysis").then((mod) => ({ default: mod.OpponentAnalysis })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)

export interface TradesPageMainProps {
  user: SleeperUser
  leagues: SleeperLeague[]
  selectedLeague: SleeperLeague | null
  onLeagueSelect: (league: SleeperLeague | null) => void
}

export function TradesPageMain({ user, leagues, selectedLeague, onLeagueSelect }: TradesPageMainProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg py-compact-xl">
        <div className="mb-compact-xl flex flex-col gap-compact-lg md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-compact-xs text-ios-title-1 text-foreground">Trade Analysis</h1>
            <p className="text-ios-body text-text-secondary">
              Analyze trade patterns, evaluate proposals, and track market trends
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-compact-sm sm:flex-row sm:items-center sm:gap-compact-lg">
            <Select
              value={selectedLeague?.league_id || ""}
              onValueChange={(value) => {
                const league = leagues.find((l) => l.league_id === value)
                onLeagueSelect(league || null)
              }}
            >
              <SelectTrigger className="min-h-[44px] w-full sm:w-64">
                <SelectValue placeholder="Select league" />
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

        <div className="mb-compact-xl grid grid-cols-1 gap-compact-sm sm:grid-cols-2 sm:gap-compact-md lg:grid-cols-4">
          <Card className="rounded-md border-0 bg-background-elevated shadow-sm">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <ArrowRightLeft className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Total Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-0 bg-background-elevated shadow-sm">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <TrendingUp className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Active Traders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-0 bg-background-elevated shadow-sm">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <Users className="h-5 w-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-ios-title-2 text-foreground">-</p>
                  <p className="text-ios-footnote text-text-secondary">Avg Per Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-0 bg-background-elevated shadow-sm">
            <CardContent className="pt-compact-md">
              <div className="flex items-center gap-compact-sm">
                <Target className="h-5 w-5 shrink-0 text-warning" />
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
            <TabsList className="grid w-full grid-cols-2 gap-compact-xs min-h-[44px] md:grid-cols-4">
              <TabsTrigger value="history" className="min-h-[44px] text-ios-body">
                Trade History
              </TabsTrigger>
              <TabsTrigger value="evaluator" className="min-h-[44px] text-ios-body">
                Trade Evaluator
              </TabsTrigger>
              <TabsTrigger value="trends" className="min-h-[44px] text-ios-body">
                Market Trends
              </TabsTrigger>
              <TabsTrigger value="opponents" className="min-h-[44px] text-ios-body">
                Opponent Analysis
              </TabsTrigger>
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
