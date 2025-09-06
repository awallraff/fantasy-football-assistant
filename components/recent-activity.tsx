"use client"

import { useState, useEffect, useContext, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, ArrowRightLeft, UserPlus, UserMinus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { sleeperAPI, type SleeperTransaction, type SleeperUser, type SleeperRoster } from "@/lib/sleeper-api"
import { PlayerDataContext } from "@/contexts/player-data-context"

interface RecentActivityProps {
  leagueId: string
  users?: SleeperUser[]
  rosters?: SleeperRoster[]
}

interface EnhancedTransaction extends SleeperTransaction {
  playerDetails: Array<{
    playerId: string
    playerName: string
    position: string
    team: string
    action: "added" | "dropped"
    rosterName: string
    valueImpact: number
    projectedRankingChange: number
  }>
  overallImpact: "positive" | "negative" | "neutral"
  impactScore: number
}

export function RecentActivity({ leagueId, users = [], rosters = [] }: RecentActivityProps) {
  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const context = useContext(PlayerDataContext)
  if (!context) {
    throw new Error('RecentActivity must be used within a PlayerDataProvider')
  }
  const { players, isLoading: playersLoading } = context

  const calculatePlayerValue = useCallback((playerId: string): number => {
    const player = players[playerId]
    if (!player) return 0

    // Basic value calculation based on position
    const positionValues = {
      QB: 15,
      RB: 20,
      WR: 18,
      TE: 12,
      K: 3,
      DEF: 5,
    }

    const baseValue = positionValues[player.position as keyof typeof positionValues] || 10

    // Adjust for team quality (simplified)
    const topTierTeams = ["KC", "BUF", "SF", "DAL", "PHI"]
    const teamMultiplier = topTierTeams.includes(player.team || "") ? 1.2 : 1.0

    return Math.round(baseValue * teamMultiplier)
  }, [players])

  const calculateRankingChange = (addedValue: number, droppedValue: number): number => {
    const netValue = addedValue - droppedValue
    // Convert value difference to ranking change (simplified)
    return Math.round(netValue / 5) // Every 5 points of value = 1 ranking position
  }

  const enhanceTransactions = useCallback((rawTransactions: SleeperTransaction[]): EnhancedTransaction[] => {
    return rawTransactions.map((transaction) => {
      const playerDetails: EnhancedTransaction["playerDetails"] = []
      let totalValueAdded = 0
      let totalValueDropped = 0

      // Process added players
      if (transaction.adds) {
        Object.entries(transaction.adds).forEach(([playerId, rosterId]) => {
          const player = players[playerId]
          const roster = rosters.find((r) => r.roster_id === rosterId)
          const owner = users.find((u) => u.user_id === roster?.owner_id)
          const playerValue = calculatePlayerValue(playerId)
          totalValueAdded += playerValue

          playerDetails.push({
            playerId,
            playerName: player ? `${player.first_name} ${player.last_name}` : `Player ${playerId}`,
            position: player?.position || "Unknown",
            team: player?.team || "FA",
            action: "added",
            rosterName: owner?.display_name || owner?.username || `Team ${rosterId}`,
            valueImpact: playerValue,
            projectedRankingChange: 0, // Will be calculated after processing all players
          })
        })
      }

      // Process dropped players
      if (transaction.drops) {
        Object.entries(transaction.drops).forEach(([playerId, rosterId]) => {
          const player = players[playerId]
          const roster = rosters.find((r) => r.roster_id === rosterId)
          const owner = users.find((u) => u.user_id === roster?.owner_id)
          const playerValue = calculatePlayerValue(playerId)
          totalValueDropped += playerValue

          playerDetails.push({
            playerId,
            playerName: player ? `${player.first_name} ${player.last_name}` : `Player ${playerId}`,
            position: player?.position || "Unknown",
            team: player?.team || "FA",
            action: "dropped",
            rosterName: owner?.display_name || owner?.username || `Team ${rosterId}`,
            valueImpact: -playerValue,
            projectedRankingChange: 0, // Will be calculated after processing all players
          })
        })
      }

      // Calculate overall impact
      const netValue = totalValueAdded - totalValueDropped
      const rankingChange = calculateRankingChange(totalValueAdded, totalValueDropped)

      // Update ranking changes for all player details
      playerDetails.forEach((detail) => {
        detail.projectedRankingChange =
          detail.action === "added" ? Math.max(1, rankingChange) : Math.min(-1, -rankingChange)
      })

      const overallImpact: "positive" | "negative" | "neutral" =
        netValue > 5 ? "positive" : netValue < -5 ? "negative" : "neutral"

      return {
        ...transaction,
        playerDetails,
        overallImpact,
        impactScore: Math.abs(netValue),
      }
    })
  }, [players, rosters, users, calculatePlayerValue])

  const getCurrentNFLWeek = (): number => {
    // NFL season typically starts in early September
    // This is a simplified calculation - in production you'd want to use a more accurate method
    const now = new Date()
    const seasonStart = new Date(now.getFullYear(), 8, 7) // September 7th approximation

    if (now < seasonStart) {
      // Pre-season or off-season
      return 1
    }

    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.min(Math.max(weeksSinceStart + 1, 1), 18) // NFL regular season is 18 weeks
  }

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      if (!leagueId) {
        console.error("No league ID provided to RecentActivity")
        setTransactions([])
        return
      }

      console.log(`Loading recent transactions for league: ${leagueId}`)

      const currentWeek = getCurrentNFLWeek()
      const weeksToCheck = [currentWeek, currentWeek - 1, currentWeek - 2].filter((week) => week > 0)

      console.log(`Checking weeks: ${weeksToCheck.join(", ")} for recent activity`)

      // Fetch transactions for multiple recent weeks
      const allTransactionPromises = [
        sleeperAPI.getTransactions(leagueId), // All transactions
        ...weeksToCheck.map((week) => sleeperAPI.getTransactions(leagueId, week)), // Specific weeks
      ]

      const allTransactionResults = await Promise.all(allTransactionPromises)
      const allTransactions = allTransactionResults.flat()

      // Remove duplicates based on transaction_id
      const uniqueTransactions = allTransactions.filter(
        (transaction, index, self) => index === self.findIndex((t) => t.transaction_id === transaction.transaction_id),
      )

      if (!Array.isArray(uniqueTransactions) || uniqueTransactions.length === 0) {
        console.warn("No transactions found")
        setTransactions([])
        return
      }

      console.log(`Found ${uniqueTransactions.length} total unique transactions`)

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const lastWeekTransactions = uniqueTransactions.filter((transaction) => {
        // Check if transaction has a valid created timestamp
        if (!transaction.created || typeof transaction.created !== "number") {
          console.warn("Transaction missing or invalid created timestamp:", transaction.transaction_id)
          return false
        }

        // Sleeper timestamps are in milliseconds
        const transactionDate = new Date(transaction.created)
        const oneWeekAgoDate = new Date(oneWeekAgo)

        console.log(
          `Transaction ${transaction.transaction_id}: ${transactionDate.toISOString()} vs ${oneWeekAgoDate.toISOString()}`,
        )

        const isRecent = transaction.created > oneWeekAgo
        const isValidType =
          transaction.type === "trade" || transaction.type === "waiver" || transaction.type === "free_agent"

        return isRecent && isValidType
      })

      console.log(`Found ${lastWeekTransactions.length} transactions from the last week`)

      let transactionsToShow = lastWeekTransactions
      if (transactionsToShow.length === 0) {
        console.log("No recent transactions found, showing last 10 transactions for debugging")
        transactionsToShow = uniqueTransactions
          .filter((t) => t.type === "trade" || t.type === "waiver" || t.type === "free_agent")
          .sort((a, b) => b.created - a.created)
          .slice(0, 10)
      }

      // Enhance transactions with player details and value metrics
      const enhancedTransactions = enhanceTransactions(transactionsToShow)

      // Sort by created date (most recent first)
      enhancedTransactions.sort((a, b) => b.created - a.created)

      setTransactions(enhancedTransactions.slice(0, 15)) // Show top 15 most recent
    } catch (error) {
      console.error("Error loading transactions:", error instanceof Error ? error.message : error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [leagueId, enhanceTransactions])

  useEffect(() => {
    if (!playersLoading && Object.keys(players).length > 0) {
      loadTransactions()
    }
  }, [leagueId, playersLoading, players, loadTransactions])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "trade":
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
      case "waiver":
        return <UserPlus className="h-4 w-4 text-orange-600" />
      case "free_agent":
        return <UserPlus className="h-4 w-4 text-green-600" />
      default:
        return <UserMinus className="h-4 w-4 text-gray-600" />
    }
  }

  const getImpactIcon = (impact: "positive" | "negative" | "neutral") => {
    switch (impact) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionDescription = (transaction: EnhancedTransaction) => {
    switch (transaction.type) {
      case "trade":
        return `Trade involving ${transaction.playerDetails.length} players`
      case "waiver":
        return "Waiver wire claim"
      case "free_agent":
        return "Free agent pickup"
      default:
        return transaction.type
    }
  }

  if (playersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading player data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Loading player information...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent League Activity</CardTitle>
            <CardDescription>
              {transactions.length > 0
                ? `Showing ${transactions.length} recent transactions with value impact analysis`
                : "Recent transactions from the past week"}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={loadTransactions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {loading ? (
              <div>
                <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
                Loading transactions...
              </div>
            ) : (
              <div>
                <p className="mb-2">No recent activity found</p>
                <p className="text-sm">
                  Try refreshing or check if there have been any trades, waiver claims, or free agent pickups in the
                  last week.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map((transaction) => (
              <div key={transaction.transaction_id} className="border rounded-lg p-4 space-y-3">
                {/* Transaction Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.type === "trade" ? "default" : "secondary"}>
                          {transaction.type.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(transaction.created)}</span>
                      </div>
                      <p className="text-sm font-medium mt-1">{getTransactionDescription(transaction)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImpactIcon(transaction.overallImpact)}
                    <Badge
                      variant={
                        transaction.overallImpact === "positive"
                          ? "default"
                          : transaction.overallImpact === "negative"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      Impact: {transaction.impactScore}
                    </Badge>
                  </div>
                </div>

                {/* Player Details */}
                {transaction.playerDetails.length > 0 && (
                  <div className="space-y-2">
                    {transaction.playerDetails.map((detail, index) => (
                      <div
                        key={`${detail.playerId}-${index}`}
                        className={`flex items-center justify-between p-2 rounded ${
                          detail.action === "added"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {detail.position}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{detail.playerName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {detail.team} • {detail.action} by {detail.rosterName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                detail.valueImpact > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {detail.valueImpact > 0 ? "+" : ""}
                              {detail.valueImpact}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {detail.projectedRankingChange > 0 ? "+" : ""}
                              {detail.projectedRankingChange} rank
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impact Summary */}
                {transaction.impactScore > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Overall Team Impact</span>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(transaction.impactScore * 2, 100)} className="w-20 h-2" />
                        <span
                          className={`font-medium ${
                            transaction.overallImpact === "positive"
                              ? "text-green-600"
                              : transaction.overallImpact === "negative"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {transaction.overallImpact}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
