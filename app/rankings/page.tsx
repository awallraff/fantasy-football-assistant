"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Brain, TrendingUp, AlertCircle } from "lucide-react"
import { RankingsImporter } from "@/components/rankings-importer"
import { RankingsManager } from "@/components/rankings-manager"
import { RankingsComparison } from "@/components/rankings-comparison"
import { PlayerSearch } from "@/components/player-search"
import { PlayerDetailModal } from "@/components/player-detail-modal"
import { APIKeyManager } from "@/components/api-key-manager"
import type { RankingSystem, PlayerRanking } from "@/lib/rankings-types"
import { usePlayerData } from "@/contexts/player-data-context"
import { normalizePosition } from "@/lib/player-utils"
import { FantasyNerdsAPI } from "@/lib/fantasy-nerds-api"

type RankingSource = "all" | "user" | "fantasy-nerds"

interface SimplePlayerRanking {
  rank: number
  playerId: string
  playerName: string
  position: string
  team: string
  projectedPoints?: number
  tier?: number
  notes?: string
  injuryStatus?: string
}

export default function RankingsPage() {
  const [userRankingSystems, setUserRankingSystems] = useState<RankingSystem[]>([])
  const [fantasyNerdsRankings, setFantasyNerdsRankings] = useState<RankingSystem[]>([])
  const [selectedSystem, setSelectedSystem] = useState<RankingSystem | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<RankingSource>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<SimplePlayerRanking | null>(null)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})

  const { players, getPlayer, isLoading: playersLoading } = usePlayerData()
  const { getItem, setItem, isClient } = useSafeLocalStorage()

  useEffect(() => {
    if (!isClient) return
    
    // Load user imported rankings from localStorage
    const saved = getItem("ranking_systems")
    if (saved) {
      try {
        const systems = JSON.parse(saved)
        setUserRankingSystems(systems)
      } catch (e) {
        console.error("Failed to load rankings:", e)
      }
    }

    // Load API keys
    const savedKeys = getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys))
      } catch (e) {
        console.error("Failed to load API keys:", e)
      }
    }
  }, [isClient, getItem])

  const loadFantasyNerdsRankings = useCallback(async () => {
    if (!apiKeys["Fantasy Nerds"]) return

    setIsLoading(true)
    try {
      const fantasyNerdsAPI = new FantasyNerdsAPI(apiKeys["Fantasy Nerds"])
      const positions = ["QB", "RB", "WR", "TE", "K", "DEF"]
      const systems: RankingSystem[] = []

      for (const position of positions) {
        try {
          const rankings = await fantasyNerdsAPI.getDraftRankings(position)
          const projections = await fantasyNerdsAPI.getDraftProjections(position)

          if (rankings.length > 0) {
            const playerRankings: PlayerRanking[] = rankings.map((fnPlayer) => {
              // Try to match with Sleeper player data
              const sleeperPlayer = Object.values(players).find(
                (p) =>
                  p.full_name?.toLowerCase().includes(fnPlayer.player.toLowerCase()) ||
                  `${p.first_name} ${p.last_name}`.toLowerCase().includes(fnPlayer.player.toLowerCase()),
              )

              const projection = projections.find((p) => p.player === fnPlayer.player)

              return {
                rank: fnPlayer.rank,
                playerId: sleeperPlayer?.player_id || `fn-${fnPlayer.playerId}`,
                playerName: sleeperPlayer?.full_name || fnPlayer.player,
                position: normalizePosition(fnPlayer.position),
                team: sleeperPlayer?.team || fnPlayer.team,
                projectedPoints: projection?.projectedPoints || fnPlayer.projectedPoints,
                tier: fnPlayer.tier,
                notes: `Fantasy Nerds ${position} Ranking`,
              }
            })

            systems.push({
              id: `fantasy-nerds-${position.toLowerCase()}`,
              name: `Fantasy Nerds ${position} Rankings`,
              description: `${position} rankings from Fantasy Nerds`,
              source: "Fantasy Nerds",
              season: "2025",
              scoringFormat: "ppr" as const,
              positions: [position],
              rankings: playerRankings,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
            })
          }
        } catch (error) {
          console.error(`Error loading Fantasy Nerds ${position} rankings:`, error)
        }
      }

      setFantasyNerdsRankings(systems)

      // Set default selection if no system selected
      if (!selectedSystem && systems.length > 0) {
        setSelectedSystem(systems[0])
      }
    } catch (error) {
      console.error("Error loading Fantasy Nerds rankings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [apiKeys, players, setItem])

  const filteredRankings = useMemo(() => {
    if (!selectedSystem) {
      return []
    }

    let rankings = selectedSystem.rankings

    // Filter by position if selected
    if (selectedPosition !== "all") {
      rankings = rankings.filter((r) => r.position === selectedPosition)
    }

    // Convert to SimplePlayerRanking format with real player data
    return rankings
      .map((ranking) => {
        const player = getPlayer(ranking.playerId)

        return {
          rank: ranking.rank,
          playerId: ranking.playerId,
          playerName: player
            ? player.full_name || `${player.first_name} ${player.last_name}` || "Unknown Player"
            : ranking.playerName,
          position: player ? normalizePosition(player.position) : ranking.position,
          team: player?.team || ranking.team || "FA",
          projectedPoints: ranking.projectedPoints,
          tier: ranking.tier,
          notes: ranking.notes,
          injuryStatus: player?.injury_status || "Healthy",
        }
      })
      .sort((a, b) => a.rank - b.rank) // Ensure proper ranking order
  }, [selectedSystem, selectedPosition, getPlayer])

  useEffect(() => {
    if (Object.keys(players).length > 0 && apiKeys["Fantasy Nerds"]) {
      loadFantasyNerdsRankings()
    }
  }, [players, apiKeys, loadFantasyNerdsRankings])

  const getAllSystems = (): RankingSystem[] => {
    switch (selectedSource) {
      case "user":
        return userRankingSystems
      case "fantasy-nerds":
        return fantasyNerdsRankings
      default:
        return [...userRankingSystems, ...fantasyNerdsRankings]
    }
  }

  const getAllPositions = (): string[] => {
    const positions = new Set<string>()
    getAllSystems().forEach((system) => {
      system.positions.forEach((pos) => {
        // Only add valid, non-empty positions
        if (pos && pos.trim() && pos !== "UNKNOWN") {
          positions.add(pos.trim())
        }
      })
    })
    return Array.from(positions).sort()
  }

  const handleImportComplete = (newSystem: RankingSystem) => {
    const updatedSystems = [...userRankingSystems, newSystem]
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    setSelectedSystem(newSystem)
  }

  const handleDeleteSystem = (systemId: string) => {
    const updatedSystems = userRankingSystems.filter((s) => s.id !== systemId)
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    if (selectedSystem?.id === systemId) {
      setSelectedSystem(getAllSystems()[0] || null)
    }
  }

  const handleUpdateSystem = (updatedSystem: RankingSystem) => {
    const updatedSystems = userRankingSystems.map((s) => (s.id === updatedSystem.id ? updatedSystem : s))
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    if (selectedSystem?.id === updatedSystem.id) {
      setSelectedSystem(updatedSystem)
    }
  }

  const refreshRankings = async () => {
    if (apiKeys["Fantasy Nerds"]) {
      await loadFantasyNerdsRankings()
    }
  }

  const hasNoDataSources = !apiKeys["Fantasy Nerds"] && userRankingSystems.length === 0

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Player Rankings</h1>
            <p className="text-muted-foreground">Real rankings from Fantasy Nerds and user-imported data</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshRankings} disabled={isLoading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {isLoading ? "Loading..." : "Refresh Rankings"}
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>

        {hasNoDataSources && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">No Data Sources Connected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect to Fantasy Nerds or import your own rankings to see player data. This application only uses
                    real data from external sources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ranking Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ranking Source</label>
                <Select value={selectedSource} onValueChange={(value: RankingSource) => setSelectedSource(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="user">User Imported</SelectItem>
                    <SelectItem value="fantasy-nerds">Fantasy Nerds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Position</label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {getAllPositions().map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ranking System</label>
                <Select
                  value={selectedSystem?.id || undefined}
                  onValueChange={(value) => {
                    const system = getAllSystems().find((s) => s.id === value)
                    setSelectedSystem(system || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllSystems().map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{userRankingSystems.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User Imported</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{fantasyNerdsRankings.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fantasy Nerds</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{filteredRankings.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedSystem && filteredRankings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedSystem.name} - {selectedPosition === "all" ? "All Positions" : selectedPosition}
                </span>
                <Badge variant="outline">{selectedSystem.source}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading player data...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRankings.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedPlayerForModal(player)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {player.rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{player.playerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{player.position}</span>
                            <span>•</span>
                            <span>{player.team}</span>
                            {player.tier && (
                              <>
                                <span>•</span>
                                <span>Tier {player.tier}</span>
                              </>
                            )}
                            {player.injuryStatus && player.injuryStatus !== "Healthy" && (
                              <>
                                <span>•</span>
                                <Badge variant="destructive" className="text-xs">
                                  {player.injuryStatus}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {player.projectedPoints && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {player.projectedPoints.toFixed(1)} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <RankingsImporter onImportComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="manage">
            <RankingsManager
              systems={getAllSystems()}
              selectedSystem={selectedSystem}
              onSelectSystem={setSelectedSystem}
              onDeleteSystem={handleDeleteSystem}
              onUpdateSystem={handleUpdateSystem}
            />
          </TabsContent>

          <TabsContent value="search">
            <PlayerSearch rankingSystems={getAllSystems()} />
          </TabsContent>

          <TabsContent value="compare">
            <RankingsComparison systems={getAllSystems()} />
          </TabsContent>

          <TabsContent value="api-keys">
            <APIKeyManager />
          </TabsContent>
        </Tabs>
      </div>

      {selectedPlayerForModal && (
        <PlayerDetailModal player={selectedPlayerForModal} onClose={() => setSelectedPlayerForModal(null)} />
      )}
    </div>
  )
}
