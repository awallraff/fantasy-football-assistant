"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Target, TrendingUp, Clock } from "lucide-react"

interface OpponentAnalysisProps {
  leagueId: string
}

interface OpponentProfile {
  userId: string
  username: string
  displayName: string
  totalTrades: number
  tradeFrequency: "high" | "medium" | "low"
  preferredPositions: string[]
  averageTradeValue: number
  tradingPatterns: {
    buyLow: number // percentage
    sellHigh: number // percentage
    positionalNeeds: number // percentage
  }
  recentActivity: Array<{
    week: number
    action: "bought" | "sold"
    position: string
    value: number
  }>
  tradeSuccess: number // win rate in trades
  negotiationStyle: "aggressive" | "fair" | "passive"
}

export function OpponentAnalysis({ leagueId }: OpponentAnalysisProps) {
  const [opponents, setOpponents] = useState<OpponentProfile[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOpponentData = async () => {
      setLoading(true)
      try {
        // In a real implementation, this would:
        // 1. Fetch league users from Sleeper API
        // 2. Analyze their historical trade data
        // 3. Calculate trading patterns and preferences
        // For now, show empty state until real data is available
        setOpponents([])
        setSelectedOpponent(null)
      } catch (error) {
        console.error("Error loading opponent data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOpponentData()
  }, [leagueId])

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStyleColor = (style: string) => {
    switch (style) {
      case "aggressive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "fair":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "passive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTradeAdvice = (opponent: OpponentProfile) => {
    const advice = []

    if (opponent.tradingPatterns.buyLow > 70) {
      advice.push("🎯 Targets undervalued players - offer struggling stars")
    }
    if (opponent.tradingPatterns.sellHigh > 70) {
      advice.push("📈 Quick to sell hot players - act fast on breakout performers")
    }
    if (opponent.tradingPatterns.positionalNeeds > 80) {
      advice.push("🔄 Trades based on roster needs - check their weak positions")
    }
    if (opponent.negotiationStyle === "aggressive") {
      advice.push("⚡ Aggressive negotiator - come prepared with strong offers")
    }
    if (opponent.negotiationStyle === "passive") {
      advice.push("🤝 Passive trader - you may need to initiate discussions")
    }
    if (opponent.tradeSuccess > 80) {
      advice.push("🏆 High success rate - they know player values well")
    }

    return advice
  }

  return (
    <div className="space-y-6">
      {/* Opponent List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            League Opponents
          </CardTitle>
          <CardDescription>Click on an opponent to view detailed trading analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading opponent analysis...</p>
            </div>
          ) : opponents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No opponent trading data available</p>
              <p className="text-sm text-gray-400">Opponent analysis will appear after league members make trades</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {opponents.map((opponent) => (
                <div
                  key={opponent.userId}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOpponent?.userId === opponent.userId
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedOpponent(opponent)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{opponent.displayName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{opponent.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getFrequencyColor(opponent.tradeFrequency)}>
                        {opponent.tradeFrequency} activity
                      </Badge>
                      <span className="text-sm font-medium">{opponent.totalTrades} trades</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      {selectedOpponent && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{selectedOpponent.totalTrades}</p>
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
                    <p className="text-2xl font-bold">{selectedOpponent.averageTradeValue.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Trade Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{selectedOpponent.tradeSuccess}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <Badge className={getStyleColor(selectedOpponent.negotiationStyle)}>
                      {selectedOpponent.negotiationStyle}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Style</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Patterns</CardTitle>
              <CardDescription>How {selectedOpponent.displayName} approaches trades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Buy Low Strategy</span>
                    <span>{selectedOpponent.tradingPatterns.buyLow}%</span>
                  </div>
                  <Progress value={selectedOpponent.tradingPatterns.buyLow} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sell High Strategy</span>
                    <span>{selectedOpponent.tradingPatterns.sellHigh}%</span>
                  </div>
                  <Progress value={selectedOpponent.tradingPatterns.sellHigh} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Positional Need Focus</span>
                    <span>{selectedOpponent.tradingPatterns.positionalNeeds}%</span>
                  </div>
                  <Progress value={selectedOpponent.tradingPatterns.positionalNeeds} className="h-2" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Preferred Positions</h4>
                <div className="flex gap-2">
                  {selectedOpponent.preferredPositions.map((position) => (
                    <Badge key={position} variant="outline">
                      {position}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trading Activity</CardTitle>
              <CardDescription>Latest moves by {selectedOpponent.displayName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedOpponent.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={activity.action === "bought" ? "default" : "secondary"}>{activity.action}</Badge>
                      <span className="font-medium">{activity.position}</span>
                      <span className="text-sm text-gray-500">Week {activity.week}</span>
                    </div>
                    <span className="font-bold">Value: {activity.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trading Advice */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Strategy Advice</CardTitle>
              <CardDescription>How to approach trades with {selectedOpponent.displayName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTradeAdvice(selectedOpponent).map((advice, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm">{advice}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
