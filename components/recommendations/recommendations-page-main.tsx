"use client"

import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Target, TrendingUp, Users } from "lucide-react"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

const TradeRecommendations = dynamic(
  () => import("@/components/trade-recommendations").then((mod) => ({ default: mod.TradeRecommendations })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const LineupOptimizer = dynamic(
  () => import("@/components/lineup-optimizer").then((mod) => ({ default: mod.LineupOptimizer })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const WaiverWireAnalyzer = dynamic(
  () => import("@/components/waiver-wire-analyzer").then((mod) => ({ default: mod.WaiverWireAnalyzer })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const StartSitAdvisor = dynamic(
  () => import("@/components/start-sit-advisor").then((mod) => ({ default: mod.StartSitAdvisor })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const StrategicInsights = dynamic(
  () => import("@/components/strategic-insights").then((mod) => ({ default: mod.StrategicInsights })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)

export interface RecommendationsPageMainProps {
  user: SleeperUser
  leagues: SleeperLeague[]
  selectedLeague: SleeperLeague | null
  selectedSeason: string
  onLeagueSelect: (league: SleeperLeague | null) => void
  onSeasonChange: (season: string) => void
}

export function RecommendationsPageMain({
  user,
  leagues,
  selectedLeague,
  selectedSeason,
  onLeagueSelect,
  onSeasonChange,
}: RecommendationsPageMainProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">AI Recommendations</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 md:text-base">
              Smart suggestions for trades, lineups, and strategic decisions
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Select value={selectedSeason} onValueChange={onSeasonChange}>
              <SelectTrigger className="min-h-[44px] w-full sm:w-32">
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

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
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
            <TabsList className="grid min-h-[44px] w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="trades" className="min-h-[44px]">
                Trade Recs
              </TabsTrigger>
              <TabsTrigger value="lineup" className="min-h-[44px]">
                Lineup
              </TabsTrigger>
              <TabsTrigger value="waiver" className="min-h-[44px]">
                Waiver Wire
              </TabsTrigger>
              <TabsTrigger value="startsit" className="min-h-[44px]">
                Start/Sit
              </TabsTrigger>
              <TabsTrigger value="insights" className="min-h-[44px]">
                Insights
              </TabsTrigger>
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
