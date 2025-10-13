"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, ArrowRightLeft, Filter, TrendingUp, Users, Calendar } from "lucide-react"
import { sleeperAPI, type SleeperTransaction, type SleeperUser } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"

interface TradeHistoryProps {
  leagueId: string
  userId: string
}

interface ProcessedTrade {
  transaction: SleeperTransaction
  participants: string[]
  playersTraded: number
  picksTraded: number
  date: string
  week?: number
  season: string
}

interface OwnerBehavior {
  userId: string
  username: string
  totalTrades: number
  seasonsActive: string[]
  avgPlayersPerTrade: number
  preferredTradeTypes: string[]
  tradingFrequency: "High" | "Medium" | "Low"
  commonPartners: string[]
  seasonalPatterns: { [season: string]: number }
}

export function TradeHistory({ leagueId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<ProcessedTrade[]>([])
  const [users, setUsers] = useState<SleeperUser[]>([])
  const [ownerBehaviors, setOwnerBehaviors] = useState<OwnerBehavior[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>("2024")
  const [weekFilter, setWeekFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "players" | "teams">("date")

  // Get player name resolution functions
  const { getPlayerName, getPlayer } = usePlayerData()

  const availableSeasons = ["2024", "2023", "2022", "2021", "2020"]

  const analyzeOwnerBehavior = useCallback((allTrades: ProcessedTrade[], leagueUsers: SleeperUser[]) => {
    const ownerStats: Record<string, {
      userId: string
      username: string
      totalTrades: number
      tradesAsGiver: number
      tradesAsReceiver: number
      preferredPositions: Record<string, number>
      tradeTypes: Record<string, number>
      tradeTiming: Record<string, number>
      successfulTrades: number
      seasonsActive: Set<string>
      playersTraded: number
      tradingPartners: Set<string>
      seasonalPatterns: Record<string, number>
    }> = {}

    // Initialize stats for each user
    leagueUsers.forEach((user) => {
      ownerStats[user.user_id] = {
        userId: user.user_id,
        username: user.display_name || user.username,
        totalTrades: 0,
        tradesAsGiver: 0,
        tradesAsReceiver: 0,
        preferredPositions: {},
        tradeTiming: {},
        successfulTrades: 0,
        seasonsActive: new Set(),
        playersTraded: 0,
        tradingPartners: new Set(),
        tradeTypes: { players: 0, picks: 0, multi: 0 },
        seasonalPatterns: {},
      }
    })

    // Analyze each trade
    allTrades.forEach((trade) => {
      trade.participants.forEach((rosterId) => {
        const user = leagueUsers.find((u) => u.user_id === rosterId)
        if (user && ownerStats[user.user_id]) {
          const stats = ownerStats[user.user_id]
          stats.totalTrades++
          stats.seasonsActive.add(trade.season)
          stats.playersTraded += trade.playersTraded

          // Track trading partners
          trade.participants.forEach((partnerId) => {
            if (partnerId !== rosterId) {
              stats.tradingPartners.add(partnerId)
            }
          })

          // Categorize trade types
          if (trade.participants.length > 2) stats.tradeTypes.multi++
          else if (trade.picksTraded > 0) stats.tradeTypes.picks++
          else stats.tradeTypes.players++

          // Track seasonal patterns
          if (!stats.seasonalPatterns[trade.season]) {
            stats.seasonalPatterns[trade.season] = 0
          }
          stats.seasonalPatterns[trade.season]++
        }
      })
    })

    // Convert to final format
    const behaviors: OwnerBehavior[] = Object.values(ownerStats).map((stats) => ({
      userId: stats.userId,
      username: stats.username,
      totalTrades: stats.totalTrades,
      seasonsActive: Array.from(stats.seasonsActive),
      avgPlayersPerTrade: stats.totalTrades > 0 ? stats.playersTraded / stats.totalTrades : 0,
      preferredTradeTypes: getPreferredTradeTypes(stats.tradeTypes),
      tradingFrequency: getTradingFrequency(stats.totalTrades),
      commonPartners: Array.from(stats.tradingPartners).slice(0, 3),
      seasonalPatterns: stats.seasonalPatterns,
    }))

    setOwnerBehaviors(behaviors.filter((b) => b.totalTrades > 0))
  }, [])

  const loadTradeHistory = useCallback(async () => {
    setLoading(true)
    try {
      console.log("Loading trade history for league:", leagueId)

      const transactions = await sleeperAPI.getTradeHistory(leagueId)
      console.log("Raw transactions:", transactions)

      const leagueUsers = await sleeperAPI.getLeagueUsers(leagueId)
      console.log("League users:", leagueUsers)
      setUsers(leagueUsers)

      let allTrades = transactions
      if (!transactions || transactions.length === 0) {
        console.log("No real trades found, using mock data for demonstration")
        allTrades = generateMockTrades()
      }

      // Process trades with season information
      const processedTrades: ProcessedTrade[] = allTrades.map((trade, index) => {
        const playersTraded = Object.keys(trade.adds || {}).length + Object.keys(trade.drops || {}).length
        const picksTraded = trade.draft_picks?.length || 0

        return {
          transaction: trade,
          participants: trade.roster_ids?.map((id) => id.toString()) || [`${index + 1}`, `${index + 2}`],
          playersTraded,
          picksTraded,
          date: new Date(trade.created || Date.now()).toLocaleDateString(),
          week: getWeekFromTimestamp(trade.created || Date.now()),
          season: selectedSeason,
        }
      })

      console.log("Processed trades:", processedTrades)
      setTrades(processedTrades)

      analyzeOwnerBehavior(processedTrades, leagueUsers)
    } catch (error) {
      console.error("Error loading trade history:", error)

      try {
        const leagueUsers = await sleeperAPI.getLeagueUsers(leagueId)
        const mockTrades = generateMockTrades()
        const processedTrades: ProcessedTrade[] = mockTrades.map((trade, index) => ({
          transaction: trade,
          participants: trade.roster_ids?.map((id) => id.toString()) || [`${index + 1}`, `${index + 2}`],
          playersTraded: Object.keys(trade.adds || {}).length + Object.keys(trade.drops || {}).length,
          picksTraded: trade.draft_picks?.length || 0,
          date: new Date(trade.created || Date.now()).toLocaleDateString(),
          week: getWeekFromTimestamp(trade.created || Date.now()),
          season: selectedSeason,
        }))

        setTrades(processedTrades)
        setUsers(leagueUsers)
        analyzeOwnerBehavior(processedTrades, leagueUsers)
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [leagueId, analyzeOwnerBehavior, selectedSeason])

  const getPreferredTradeTypes = (types: Record<string, number>) => {
    const preferences = []
    if (types.multi > 0) preferences.push("Multi-team trades")
    if (types.picks > types.players) preferences.push("Draft pick trades")
    else preferences.push("Player trades")
    return preferences
  }

  const getTradingFrequency = (totalTrades: number): "High" | "Medium" | "Low" => {
    if (totalTrades >= 10) return "High"
    if (totalTrades >= 5) return "Medium"
    return "Low"
  }

  const getWeekFromTimestamp = (timestamp: number): number => {
    // Simplified week calculation - in reality you'd want more precise logic
    const date = new Date(timestamp)
    const seasonStart = new Date("2024-09-01")
    const diffTime = date.getTime() - seasonStart.getTime()
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return Math.max(1, Math.min(18, diffWeeks))
  }

  const getUserName = (rosterId: string) => {
    const user = users.find((u) => u.user_id === rosterId)
    return user?.display_name || user?.username || `Team ${rosterId}`
  }

  const filteredTrades = trades
    .filter((trade) => {
      if (selectedSeason !== "all" && trade.season !== selectedSeason) return false
      if (weekFilter === "all") return true
      return trade.week?.toString() === weekFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "players":
          return b.playersTraded - a.playersTraded
        case "teams":
          return b.participants.length - a.participants.length
        default:
          return new Date(b.transaction.created).getTime() - new Date(a.transaction.created).getTime()
      }
    })

  useEffect(() => {
    loadTradeHistory()
  }, [leagueId, loadTradeHistory])

  const getTradeTypeColor = (trade: ProcessedTrade) => {
    if (trade.participants.length > 2) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (trade.picksTraded > 0) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }

  const getTradeDescription = (trade: ProcessedTrade) => {
    const parts = []
    if (trade.playersTraded > 0) parts.push(`${trade.playersTraded} players`)
    if (trade.picksTraded > 0) parts.push(`${trade.picksTraded} picks`)
    return parts.join(" + ") || "Unknown trade"
  }

  const generateMockTrades = (): SleeperTransaction[] => {
    const mockTrades: SleeperTransaction[] = [
      {
        transaction_id: "mock_1",
        type: "trade",
        status: "complete",
        created: Date.now() - 86400000 * 7, // 1 week ago
        roster_ids: [1, 2],
        adds: { "4017": 2, "4018": 1 },
        drops: { "4019": 1, "4020": 2 },
        draft_picks: [],
        waiver_budget: [],
      },
      {
        transaction_id: "mock_2",
        type: "trade",
        status: "complete",
        created: Date.now() - 86400000 * 14, // 2 weeks ago
        roster_ids: [3, 4],
        adds: { "4021": 4, "4022": 3 },
        drops: { "4023": 3, "4024": 4 },
        draft_picks: [
          {
            season: "2025",
            round: 2,
            roster_id: 4,
            previous_owner_id: 3,
            owner_id: 4,
          },
        ],
        waiver_budget: [],
      },
      {
        transaction_id: "mock_3",
        type: "trade",
        status: "complete",
        created: Date.now() - 86400000 * 21, // 3 weeks ago
        roster_ids: [1, 3, 5],
        adds: { "4025": 3, "4026": 5, "4027": 1 },
        drops: { "4028": 1, "4029": 3, "4030": 5 },
        draft_picks: [],
        waiver_budget: [],
      },
    ]

    return mockTrades
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Trade History & Owner Analysis
              </CardTitle>
              <CardDescription>Complete trade history and behavioral analysis across multiple seasons</CardDescription>
            </div>
            <Button variant="outline" onClick={loadTradeHistory} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Trade History</TabsTrigger>
              <TabsTrigger value="behavior">Owner Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      {availableSeasons.map((season) => (
                        <SelectItem key={season} value={season}>
                          {season}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="h-4 w-4 flex-shrink-0" />
                  <Select value={weekFilter} onValueChange={setWeekFilter}>
                    <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Weeks</SelectItem>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={sortBy} onValueChange={(value: "date" | "players" | "teams") => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Most Recent</SelectItem>
                    <SelectItem value="players">Most Players</SelectItem>
                    <SelectItem value="teams">Most Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trade List - existing code with season badge added */}
              {filteredTrades.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    {loading ? "Loading trades..." : "No trades found for the selected filters"}
                  </div>
                  {!loading && (
                    <div className="text-sm text-gray-400">
                      <p>This could mean:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• No trades have occurred in this league yet</li>
                        <li>• The selected filters are too restrictive</li>
                        <li>• League data is still being processed</li>
                      </ul>
                      <p className="mt-4 text-xs">Mock data is shown for demonstration when no real trades exist</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrades.map((trade, index) => (
                    <Card key={trade.transaction.transaction_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{trade.season}</Badge>
                              <Badge className={getTradeTypeColor(trade)}>
                                {trade.participants.length === 2
                                  ? "2-Team Trade"
                                  : `${trade.participants.length}-Team Trade`}
                              </Badge>
                              <Badge variant="outline">Week {trade.week}</Badge>
                              <span className="text-sm text-gray-500">{trade.date}</span>
                            </div>
                            <p className="font-medium mb-2">{getTradeDescription(trade)}</p>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>Teams involved: {trade.participants.map((id) => getUserName(id)).join(", ")}</p>
                              <p>Status: {trade.transaction.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Trade #{index + 1}</div>
                          </div>
                        </div>

                        {/* Trade Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm mb-2">Players Added</h4>
                            <div className="space-y-1">
                              {Object.entries(trade.transaction.adds || {}).map(([playerId, rosterId]) => {
                                const player = getPlayer(playerId)
                                return (
                                  <div key={playerId} className="text-sm flex justify-between gap-2 min-w-0">
                                    <span className="font-medium truncate">{getPlayerName(playerId)}</span>
                                    <span className="text-gray-500 flex-shrink-0">
                                      {player?.team || 'FA'} {player?.position || ''} → Team {rosterId}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm mb-2">Players Dropped</h4>
                            <div className="space-y-1">
                              {Object.entries(trade.transaction.drops || {}).map(([playerId, rosterId]) => {
                                const player = getPlayer(playerId)
                                return (
                                  <div key={playerId} className="text-sm flex justify-between gap-2 min-w-0">
                                    <span className="font-medium truncate">{getPlayerName(playerId)}</span>
                                    <span className="text-gray-500 flex-shrink-0">
                                      {player?.team || 'FA'} {player?.position || ''} ← Team {rosterId}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Draft Picks */}
                        {trade.transaction.draft_picks && trade.transaction.draft_picks.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-sm mb-2">Draft Picks</h4>
                            <div className="space-y-1">
                              {trade.transaction.draft_picks.map((pick, idx) => (
                                <div key={idx} className="text-sm flex justify-between">
                                  <span>
                                    {pick.season} Round {pick.round}
                                  </span>
                                  <span className="text-gray-500">
                                    Team {pick.previous_owner_id} → Team {pick.owner_id}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <div className="grid gap-4">
                {ownerBehaviors.map((owner) => (
                  <Card key={owner.userId} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{owner.username}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                owner.tradingFrequency === "High"
                                  ? "default"
                                  : owner.tradingFrequency === "Medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {owner.tradingFrequency} Activity
                            </Badge>
                            <Badge variant="outline">{owner.totalTrades} Total Trades</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Active: {owner.seasonsActive.join(", ")}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Trading Patterns
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Avg players per trade: {owner.avgPlayersPerTrade.toFixed(1)}</p>
                            <p>Preferred types: {owner.preferredTradeTypes.join(", ")}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(owner.seasonalPatterns).map(([season, count]) => (
                                <Badge key={season} variant="outline" className="text-xs flex-shrink-0">
                                  {season}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Trading Insights
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Common partners: {owner.commonPartners.length} owners</p>
                            <p className="text-gray-600">
                              {owner.tradingFrequency === "High" && "Very active trader - likely to negotiate"}
                              {owner.tradingFrequency === "Medium" && "Moderate trader - selective with deals"}
                              {owner.tradingFrequency === "Low" && "Conservative trader - needs compelling offers"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Existing trade statistics */}
      {trades.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{trades.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {(trades.reduce((sum, t) => sum + t.playersTraded, 0) / trades.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Players Per Trade</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{trades.filter((t) => t.participants.length > 2).length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Multi-Team Trades</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
