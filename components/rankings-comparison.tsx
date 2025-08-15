"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { RankingSystem } from "@/lib/rankings-types"

interface RankingsComparisonProps {
  systems: RankingSystem[]
}

interface ComparisonData {
  playerName: string
  position: string
  team: string
  rankings: { [systemId: string]: number }
  averageRank: number
  variance: number
  trend: "up" | "down" | "stable"
}

export function RankingsComparison({ systems }: RankingsComparisonProps) {
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])

  const handleSystemToggle = (systemId: string) => {
    const newSelected = selectedSystems.includes(systemId)
      ? selectedSystems.filter((id) => id !== systemId)
      : [...selectedSystems, systemId]

    setSelectedSystems(newSelected)
    generateComparison(newSelected)
  }

  const generateComparison = (systemIds: string[]) => {
    if (systemIds.length < 2) {
      setComparisonData([])
      return
    }

    const selectedSystemsData = systems.filter((s) => systemIds.includes(s.id))
    const playerMap = new Map<string, ComparisonData>()

    // Find common players across selected systems
    selectedSystemsData.forEach((system) => {
      system.rankings.forEach((player) => {
        const key = `${player.playerName}_${player.position}_${player.team}`

        if (!playerMap.has(key)) {
          playerMap.set(key, {
            playerName: player.playerName,
            position: player.position,
            team: player.team,
            rankings: {},
            averageRank: 0,
            variance: 0,
            trend: "stable",
          })
        }

        playerMap.get(key)!.rankings[system.id] = player.rank
      })
    })

    // Filter to only include players that appear in all selected systems
    const commonPlayers = Array.from(playerMap.values()).filter(
      (player) => Object.keys(player.rankings).length === systemIds.length,
    )

    // Calculate statistics
    const comparison = commonPlayers.map((player) => {
      const ranks = Object.values(player.rankings)
      player.averageRank = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
      player.variance = Math.max(...ranks) - Math.min(...ranks)

      // Determine trend (simplified - could be more sophisticated)
      const firstRank = ranks[0]
      const lastRank = ranks[ranks.length - 1]
      if (lastRank < firstRank - 2) player.trend = "up"
      else if (lastRank > firstRank + 2) player.trend = "down"
      else player.trend = "stable"

      return player
    })

    // Filter by position
    const filtered = positionFilter === "all" ? comparison : comparison.filter((p) => p.position === positionFilter)

    // Sort by average rank
    filtered.sort((a, b) => a.averageRank - b.averageRank)

    setComparisonData(filtered.slice(0, 50)) // Limit to top 50
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance <= 5) return "text-green-600"
    if (variance <= 15) return "text-yellow-600"
    return "text-red-600"
  }

  // Get unique positions from all systems
  const allPositions = [...new Set(systems.flatMap((s) => s.rankings.map((r) => r.position)))]

  // Prepare chart data for top 10 players with highest variance
  const chartData = comparisonData
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 10)
    .map((player) => ({
      name: player.playerName.split(" ").pop(), // Last name only for chart
      ...player.rankings,
      average: player.averageRank,
    }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rankings Comparison</CardTitle>
          <CardDescription>
            Compare player rankings across multiple systems to identify consensus and outliers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Selection */}
          <div>
            <h4 className="font-medium mb-3">Select Systems to Compare (minimum 2)</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSystems.includes(system.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleSystemToggle(system.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{system.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{system.source}</p>
                    </div>
                    <Badge variant={selectedSystems.includes(system.id) ? "default" : "outline"}>
                      {system.rankings.length} players
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Position Filter */}
          {selectedSystems.length >= 2 && (
            <div className="flex items-center gap-4">
              <label className="font-medium">Filter by Position:</label>
              <Select
                value={positionFilter}
                onValueChange={(value) => {
                  setPositionFilter(value)
                  generateComparison(selectedSystems)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {allPositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variance Chart */}
      {comparisonData.length > 0 && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking Variance - Top 10 Most Disputed Players</CardTitle>
            <CardDescription>Players with the biggest differences in rankings across systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {selectedSystems.map((systemId, index) => {
                    const system = systems.find((s) => s.id === systemId)
                    return (
                      <Bar
                        key={systemId}
                        dataKey={systemId}
                        name={system?.name}
                        fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Player Comparison Table</CardTitle>
            <CardDescription>
              Showing {comparisonData.length} players that appear in all selected systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Avg Rank</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Trend</TableHead>
                    {selectedSystems.map((systemId) => {
                      const system = systems.find((s) => s.id === systemId)
                      return <TableHead key={systemId}>{system?.name}</TableHead>
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.slice(0, 25).map((player, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{player.playerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.position}</Badge>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell className="font-medium">{player.averageRank.toFixed(1)}</TableCell>
                      <TableCell className={getVarianceColor(player.variance)}>{player.variance}</TableCell>
                      <TableCell>{getTrendIcon(player.trend)}</TableCell>
                      {selectedSystems.map((systemId) => (
                        <TableCell key={systemId} className="font-medium">
                          {player.rankings[systemId]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSystems.length < 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">Select at least 2 ranking systems to compare players</div>
          </CardContent>
        </Card>
      )}

      {selectedSystems.length >= 2 && comparisonData.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">No common players found across the selected systems</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
