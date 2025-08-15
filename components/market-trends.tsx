"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react"

interface MarketTrendsProps {
  leagueId: string
}

interface PlayerTrend {
  playerId: string
  playerName: string
  position: string
  team: string
  currentValue: number
  weeklyValues: Array<{ week: number; value: number }>
  trend: "up" | "down" | "stable"
  trendPercentage: number
  tradeVolume: number
}

interface PositionTrend {
  position: string
  averageValue: number
  weeklyAverages: Array<{ week: number; value: number }>
  totalTrades: number
  trend: "up" | "down" | "stable"
}

export function MarketTrends({ leagueId }: MarketTrendsProps) {
  const [playerTrends, setPlayerTrends] = useState<PlayerTrend[]>([])
  const [positionTrends, setPositionTrends] = useState<PositionTrend[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<string>("4weeks")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true)
      try {
        // In a real implementation, this would fetch actual trade data and calculate trends
        // For now, show empty state
        setPlayerTrends([])
        setPositionTrends([])
      } catch (error) {
        console.error("Error loading market trends:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMarketData()
  }, [leagueId])

  const filteredPlayerTrends = playerTrends.filter((player) => {
    if (selectedPosition === "all") return true
    return player.position === selectedPosition
  })

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="QB">QB</SelectItem>
                <SelectItem value="RB">RB</SelectItem>
                <SelectItem value="WR">WR</SelectItem>
                <SelectItem value="TE">TE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
                <SelectItem value="season">Full Season</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Position Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Position Value Trends
          </CardTitle>
          <CardDescription>Average trade values by position over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">Loading market trends...</p>
            </div>
          ) : positionTrends.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No market trend data available</p>
                <p className="text-sm text-gray-400">Trade data will appear here once league activity begins</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  {positionTrends.map((position, index) => (
                    <Line
                      key={position.position}
                      data={position.weeklyAverages}
                      type="monotone"
                      dataKey="value"
                      stroke={`hsl(${(index * 90) % 360}, 70%, 50%)`}
                      name={position.position}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {positionTrends.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No position trend data available</p>
              <p className="text-sm text-gray-400">Position analysis will appear after trades occur in your league</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {positionTrends.map((position) => (
            <Card key={position.position}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{position.position}</Badge>
                  {getTrendIcon(position.trend)}
                </div>
                <p className="text-2xl font-bold">{position.averageValue.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Value</p>
                <p className="text-sm text-gray-500 mt-1">{position.totalTrades} trades</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trending Players</CardTitle>
          <CardDescription>Players with the biggest value changes and trade activity</CardDescription>
        </CardHeader>
        <CardContent>
          {playerTrends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No trending player data available</p>
              <p className="text-sm text-gray-400">Player trends will appear based on league trade activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlayerTrends
                .sort((a, b) => Math.abs(b.trendPercentage) - Math.abs(a.trendPercentage))
                .map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{player.playerName}</h4>
                        <Badge variant="outline">{player.position}</Badge>
                        <span className="text-sm text-gray-500">{player.team}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          Current Value: <strong>{player.currentValue}</strong>
                        </span>
                        <span>
                          Trade Volume: <strong>{player.tradeVolume}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${getTrendColor(player.trend)}`}>
                        {getTrendIcon(player.trend)}
                        <span className="font-bold">
                          {player.trendPercentage > 0 ? "+" : ""}
                          {player.trendPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Volume by Position</CardTitle>
          <CardDescription>Number of trades involving each position</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="position" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalTrades" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
