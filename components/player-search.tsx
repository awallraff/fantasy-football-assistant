"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import type { RankingSystem } from "@/lib/rankings-types"

interface PlayerSearchProps {
  rankingSystems: RankingSystem[]
}

interface PlayerSearchResult {
  playerName: string
  position: string
  team: string
  rankings: Array<{
    systemName: string
    rank: number
    tier?: number
    projectedPoints?: number
  }>
  averageRank: number
  bestRank: number
  worstRank: number
  rankVariance: number
}

export function PlayerSearch({ rankingSystems }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([])

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (!term.trim() || rankingSystems.length === 0) {
      setSearchResults([])
      return
    }

    // Find players across all ranking systems
    const playerMap = new Map<string, PlayerSearchResult>()

    rankingSystems.forEach((system) => {
      system.rankings
        .filter((player) => player.playerName.toLowerCase().includes(term.toLowerCase()))
        .forEach((player) => {
          const key = `${player.playerName}_${player.position}_${player.team}`

          if (!playerMap.has(key)) {
            playerMap.set(key, {
              playerName: player.playerName,
              position: player.position,
              team: player.team,
              rankings: [],
              averageRank: 0,
              bestRank: Number.POSITIVE_INFINITY,
              worstRank: 0,
              rankVariance: 0,
            })
          }

          const result = playerMap.get(key)!
          result.rankings.push({
            systemName: system.name,
            rank: player.rank,
            tier: player.tier,
            projectedPoints: player.projectedPoints,
          })
        })
    })

    // Calculate statistics for each player
    const results = Array.from(playerMap.values()).map((result) => {
      const ranks = result.rankings.map((r) => r.rank)
      result.averageRank = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
      result.bestRank = Math.min(...ranks)
      result.worstRank = Math.max(...ranks)
      result.rankVariance = result.worstRank - result.bestRank

      return result
    })

    // Sort by average rank
    results.sort((a, b) => a.averageRank - b.averageRank)

    setSearchResults(results.slice(0, 20)) // Limit to top 20 results
  }

  const getVarianceColor = (variance: number) => {
    if (variance <= 5) return "text-green-600"
    if (variance <= 15) return "text-yellow-600"
    return "text-red-600"
  }

  const getVarianceIcon = (variance: number) => {
    if (variance <= 5) return <TrendingUp className="h-3 w-3" />
    return <TrendingDown className="h-3 w-3" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Player Search
        </CardTitle>
        <CardDescription>Search for players across all your ranking systems</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for a player..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Search Results ({searchResults.length})</h3>
            {searchResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{result.playerName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{result.position}</Badge>
                        <Badge variant="secondary">{result.team}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rank</p>
                      <p className="text-2xl font-bold">{result.averageRank.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Ranking Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Best Rank</p>
                      <p className="font-medium text-green-600">{result.bestRank}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Worst Rank</p>
                      <p className="font-medium text-red-600">{result.worstRank}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Variance</p>
                      <div className={`flex items-center gap-1 font-medium ${getVarianceColor(result.rankVariance)}`}>
                        {getVarianceIcon(result.rankVariance)}
                        {result.rankVariance}
                      </div>
                    </div>
                  </div>

                  {/* Individual Rankings */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Rankings by System ({result.rankings.length})
                    </p>
                    <div className="grid gap-2">
                      {result.rankings.map((ranking, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="font-medium">{ranking.systemName}</span>
                          <div className="flex items-center gap-3">
                            {ranking.tier && (
                              <Badge variant="outline" className="text-xs">
                                Tier {ranking.tier}
                              </Badge>
                            )}
                            {ranking.projectedPoints && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {ranking.projectedPoints.toFixed(1)} pts
                              </span>
                            )}
                            <span className="font-bold">#{ranking.rank}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">No players found matching &quot;{searchTerm}&quot;</div>
        )}

        {rankingSystems.length === 0 && (
          <div className="text-center py-8 text-gray-500">Import some ranking systems first to search for players</div>
        )}
      </CardContent>
    </Card>
  )
}
