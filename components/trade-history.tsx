"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, ArrowRightLeft, Filter, TrendingUp, Users, Calendar, ArrowRight, ArrowDown, Trophy } from "lucide-react"
import { sleeperAPI, type SleeperTransaction, type SleeperUser, type SleeperPlayer } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { tradeEvaluationService, type TradeEvaluation } from "@/lib/trade-evaluation-service"

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
  evaluation?: TradeEvaluation
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
  const [ownerBehaviors, setOwnerBehaviors] = useState<OwnerBehavior[]>([])
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>("2024")
  const [weekFilter, setWeekFilter] = useState<string>("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "players" | "teams">("date")

  // Get player name resolution functions
  const { getPlayerName, getPlayer, players } = usePlayerData()

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
        username: user.display_name || user.username || `User ${user.user_id}`,
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

  const evaluateTrades = useCallback(async (processedTrades: ProcessedTrade[], leagueUsers: SleeperUser[], leagueRosters: { roster_id: number; owner_id: string }[]) => {
    if (processedTrades.length === 0) return processedTrades

    setEvaluating(true)
    console.log("Evaluating trades with NFL data and rankings...")

    try {
      // Build roster ID to owner name map
      const rosterIdToOwnerName = new Map<number, string>()
      leagueRosters.forEach(roster => {
        const user = leagueUsers.find(u => u.user_id === roster.owner_id)
        if (user) {
          rosterIdToOwnerName.set(roster.roster_id, user.display_name || user.username || `Team ${roster.roster_id}`)
        }
      })

      // Build player cache for evaluation service
      const playerCache = new Map<string, SleeperPlayer>()
      if (players) {
        Object.entries(players).forEach(([playerId, player]) => {
          playerCache.set(playerId, player)
        })
      }

      tradeEvaluationService.setPlayerCache(playerCache)

      // Evaluate each trade
      const evaluatedTrades = await Promise.all(
        processedTrades.map(async (trade) => {
          try {
            const evaluation = await tradeEvaluationService.evaluateTransaction(
              trade.transaction,
              rosterIdToOwnerName,
              trade.week
            )
            return { ...trade, evaluation }
          } catch (error) {
            console.error(`Error evaluating trade ${trade.transaction.transaction_id}:`, error)
            return trade
          }
        })
      )

      console.log("Trade evaluation complete")
      return evaluatedTrades
    } catch (error) {
      console.error("Error during trade evaluation:", error)
      return processedTrades
    } finally {
      setEvaluating(false)
    }
  }, [players])

  const loadTradeHistory = useCallback(async () => {
    setLoading(true)
    try {
      console.log("Loading trade history for league:", leagueId)

      // Fetch all transactions (not just trades - we want waivers and FA adds too)
      const allTransactions = await sleeperAPI.getTransactions(leagueId)
      console.log("Raw transactions:", allTransactions)

      const leagueUsers = await sleeperAPI.getLeagueUsers(leagueId)
      const leagueRosters = await sleeperAPI.getLeagueRosters(leagueId)
      console.log("League users:", leagueUsers)

      const transactions = allTransactions
      if (!transactions || transactions.length === 0) {
        console.log("No transactions found for this league")
        setTrades([])
        analyzeOwnerBehavior([], leagueUsers)
        return
      }

      // Process all transactions (trades, waivers, free agents)
      const processedTrades: ProcessedTrade[] = transactions.map((transaction) => {
        const playersTraded = Object.keys(transaction.adds || {}).length + Object.keys(transaction.drops || {}).length
        const picksTraded = transaction.draft_picks?.length || 0

        // Map roster IDs to owner user IDs for proper matching
        const participantUserIds = (transaction.roster_ids || []).map(rosterId => {
          const roster = leagueRosters.find(r => r.roster_id === rosterId)
          return roster?.owner_id || rosterId.toString()
        })

        return {
          transaction,
          participants: participantUserIds,
          playersTraded,
          picksTraded,
          date: new Date(transaction.created || Date.now()).toLocaleDateString(),
          week: getWeekFromTimestamp(transaction.created || Date.now()),
          season: selectedSeason,
        }
      })

      console.log("Processed trades:", processedTrades)

      // Evaluate trades with NFL data and rankings
      const evaluatedTrades = await evaluateTrades(processedTrades, leagueUsers, leagueRosters)
      setTrades(evaluatedTrades)

      analyzeOwnerBehavior(evaluatedTrades, leagueUsers)
    } catch (error) {
      console.error("Error loading trade history:", error)
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [leagueId, analyzeOwnerBehavior, selectedSeason, evaluateTrades])

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

  const filteredTrades = trades
    .filter((trade) => {
      if (selectedSeason !== "all" && trade.season !== selectedSeason) return false
      if (weekFilter !== "all" && trade.week?.toString() !== weekFilter) return false

      // Filter by transaction type
      if (transactionTypeFilter === "trades" && trade.transaction.type !== "trade") return false
      if (transactionTypeFilter === "waivers" && trade.transaction.type !== "waiver") return false
      if (transactionTypeFilter === "free_agents" && trade.transaction.type !== "free_agent") return false

      return true
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
            <Button variant="outline" onClick={loadTradeHistory} disabled={loading} className="min-h-[44px]">
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
              {evaluating && (
                <div className="bg-background-elevated border border-border/50 rounded-lg p-3 text-ios-subheadline text-foreground">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Evaluating trades with NFL data and rankings...</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                      <SelectTrigger className="w-full min-h-[44px]">
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

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <Select value={weekFilter} onValueChange={setWeekFilter}>
                      <SelectTrigger className="w-full min-h-[44px]">
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
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ArrowRightLeft className="h-4 w-4 flex-shrink-0" />
                    <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                      <SelectTrigger className="w-full min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transactions</SelectItem>
                        <SelectItem value="trades">Owner Trades Only</SelectItem>
                        <SelectItem value="waivers">Waiver Adds Only</SelectItem>
                        <SelectItem value="free_agents">Free Agent Adds Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <Select value={sortBy} onValueChange={(value: "date" | "players" | "teams") => setSortBy(value)}>
                      <SelectTrigger className="w-full min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Most Recent</SelectItem>
                        <SelectItem value="players">Most Players</SelectItem>
                        <SelectItem value="teams">Most Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Trade List - existing code with season badge added */}
              {filteredTrades.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-text-secondary mb-4 text-ios-body">
                    {loading ? "Loading trades..." : "No transactions found for the selected filters"}
                  </div>
                  {!loading && (
                    <div className="text-ios-subheadline text-text-secondary">
                      <p>This could mean:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• No transactions have occurred in this league yet</li>
                        <li>• The selected filters are too restrictive</li>
                        <li>• Try selecting &quot;All Transactions&quot; or a different week</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrades.map((trade, index) => {
                    const evaluation = trade.evaluation
                    const isOwnerTrade = trade.transaction.type === "trade"
                    const typeLabel = trade.transaction.type === "trade" ? "Owner Trade" : trade.transaction.type === "waiver" ? "Waiver Add" : "Free Agent Add"
                    const borderColor = isOwnerTrade ? "border-l-blue-500" : trade.transaction.type === "waiver" ? "border-l-orange-500" : "border-l-green-500"

                    return (
                      <Card key={trade.transaction.transaction_id} className={`border-l-4 ${borderColor}`}>
                        <CardContent className="pt-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <Badge variant="secondary">{trade.season}</Badge>
                                <Badge className={
                                  isOwnerTrade
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : trade.transaction.type === "waiver"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }>
                                  {typeLabel}
                                </Badge>
                                <Badge variant="outline">Week {trade.week}</Badge>
                                <span className="text-ios-subheadline text-text-secondary">{trade.date}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-ios-subheadline text-text-secondary">#{index + 1}</div>
                            </div>
                          </div>

                          {/* Evaluation Summary (for owner trades) */}
                          {evaluation && isOwnerTrade && evaluation.winner && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-4">
                              <div className="flex items-start gap-2">
                                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm mb-1">Trade Analysis</p>
                                  <p className="text-ios-subheadline text-foreground">{evaluation.analysis}</p>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant={
                                      evaluation.overallFairness === 'very_fair' ? 'default' :
                                      evaluation.overallFairness === 'fair' ? 'secondary' :
                                      'destructive'
                                    }>
                                      {evaluation.overallFairness.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    {evaluation.winnerAdvantage > 0 && (
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        +{evaluation.winnerAdvantage.toFixed(1)} value advantage
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Trade Participants */}
                          {evaluation && evaluation.participants.length > 0 ? (
                            <div className="space-y-4">
                              {evaluation.participants.map((participant) => (
                                <div key={participant.rosterId} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      {participant.ownerName}
                                      {evaluation.winner === participant.rosterId.toString() && (
                                        <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                      )}
                                    </h4>
                                    <Badge variant={participant.netValue >= 0 ? 'default' : 'destructive'}>
                                      {participant.netValue >= 0 ? '+' : ''}{participant.netValue.toFixed(1)} value
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Players Received (GETS) */}
                                    {participant.playersReceived.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-1 mb-2">
                                          <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-medium text-green-700 dark:text-green-400">GETS</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {participant.playersReceived.map((player) => (
                                            <div key={player.playerId} className="text-sm bg-green-50 dark:bg-green-900/20 rounded p-2">
                                              <div className="flex justify-between items-start gap-2">
                                                <span className="font-medium">{player.playerName}</span>
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                  {player.tradeValue.toFixed(0)}
                                                </Badge>
                                              </div>
                                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                {player.position} • {player.team}
                                                {player.currentRank && ` • Rank ${player.currentRank}`}
                                                {player.recentPerformance && (
                                                  <span className="ml-1">
                                                    • {player.recentPerformance.last4WeeksAvg.toFixed(1)} PPG
                                                    {player.recentPerformance.trend === 'improving' && ' 📈'}
                                                    {player.recentPerformance.trend === 'declining' && ' 📉'}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Players Given (GIVES) */}
                                    {participant.playersGiven.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-1 mb-2">
                                          <ArrowRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                                          <span className="text-sm font-medium text-red-700 dark:text-red-400">GIVES</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {participant.playersGiven.map((player) => (
                                            <div key={player.playerId} className="text-sm bg-red-50 dark:bg-red-900/20 rounded p-2">
                                              <div className="flex justify-between items-start gap-2">
                                                <span className="font-medium">{player.playerName}</span>
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                  {player.tradeValue.toFixed(0)}
                                                </Badge>
                                              </div>
                                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                {player.position} • {player.team}
                                                {player.currentRank && ` • Rank ${player.currentRank}`}
                                                {player.recentPerformance && (
                                                  <span className="ml-1">
                                                    • {player.recentPerformance.last4WeeksAvg.toFixed(1)} PPG
                                                    {player.recentPerformance.trend === 'improving' && ' 📈'}
                                                    {player.recentPerformance.trend === 'declining' && ' 📉'}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Draft Picks */}
                                  {(participant.picksReceived.length > 0 || participant.picksGiven.length > 0) && (
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {participant.picksReceived.length > 0 && (
                                          <div>
                                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Picks Received</p>
                                            {participant.picksReceived.map((pick, idx) => (
                                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                {pick.season} Rd {pick.round} (Value: {pick.estimatedValue})
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {participant.picksGiven.length > 0 && (
                                          <div>
                                            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Picks Given</p>
                                            {participant.picksGiven.map((pick, idx) => (
                                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                {pick.season} Rd {pick.round} (Value: {pick.estimatedValue})
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Fallback to old display if no evaluation */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
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
                <p className="text-ios-subheadline text-text-secondary">Total Trades</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {(trades.reduce((sum, t) => sum + t.playersTraded, 0) / trades.length).toFixed(1)}
                </p>
                <p className="text-ios-subheadline text-text-secondary">Avg Players Per Trade</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{trades.filter((t) => t.participants.length > 2).length}</p>
                <p className="text-ios-subheadline text-text-secondary">Multi-Team Trades</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
