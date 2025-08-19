"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Brain, TrendingUp, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { RankingsImporter } from "@/components/rankings-importer"
import { RankingsManager } from "@/components/rankings-manager"
import { RankingsComparison } from "@/components/rankings-comparison"
import { PlayerSearch } from "@/components/player-search"
import { PlayerDetailModal } from "@/components/player-detail-modal"
import { APIKeyManager } from "@/components/api-key-manager"
import type { RankingSystem, PlayerRanking } from "@/lib/rankings-types"
import { usePlayerData } from "@/contexts/player-data-context"
import { normalizePosition } from "@/lib/player-utils"
import { EspnAPI } from "@/lib/espn-api"
import { AIRankingsService } from "@/lib/ai-rankings-service"

type RankingSource = "all" | "user" | "espn" | "ai"

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
  const [espnRankings, setEspnRankings] = useState<RankingSystem[]>([])
  const [aiRankingSystem, setAiRankingSystem] = useState<RankingSystem | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<RankingSystem | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<RankingSource>("ai")
  const [sortBy, setSortBy] = useState<"rank" | "name" | "position" | "team" | "projectedPoints">("rank")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<SimplePlayerRanking | null>(null)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [tableSortField, setTableSortField] = useState<string>("rank")
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc")

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
        console.log("Loaded from localStorage:", systems);
      } catch (e) {
        console.error("Failed to load rankings:", e)
      }
    }

    // Load API keys
    const savedKeys = getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setApiKeys(keys)
        console.log('Loaded API keys from localStorage:', Object.keys(keys))
        
      } catch (e) {
        console.error("Failed to load API keys:", e)
      }
    }
  }, [isClient, getItem])

  // Listen for API key changes from other components
  useEffect(() => {
    if (!isClient) return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fantasy_api_keys' && e.newValue) {
        try {
          const keys = JSON.parse(e.newValue)
          setApiKeys(keys)
          console.log('API keys updated from storage event:', Object.keys(keys))
        } catch (e) {
          console.error("Failed to parse updated API keys:", e)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isClient])

  const getAllSystems = (): RankingSystem[] => {
    switch (selectedSource) {
      case "user":
        return userRankingSystems
      case "espn":
        return espnRankings
      case "ai":
        return aiRankingSystem ? [aiRankingSystem] : []
      default:
        return [...userRankingSystems, ...espnRankings]
    }
  }



  const loadEspnRankings = useCallback(async () => {
    try {
      const espnAPI = new EspnAPI()
      const rankings = await espnAPI.getDraftRankings()

      if (rankings && rankings.length > 0) {
        const playerRankings: PlayerRanking[] = rankings.map((p, index) => ({
          rank: index + 1,
          playerId: `espn-${p.id}`,
                    playerName: p.player?.fullName || `Player ${p.id}`,
          position: "N/A", // Position information is not directly available in this endpoint
          team: "N/A", // Team information is not directly available in this endpoint
        }))

        const system: RankingSystem = {
          id: `espn-draft`,
          name: `ESPN Draft Rankings`,
          description: `Draft rankings from ESPN (${rankings.length} players)`,
          source: "ESPN",
          season: "2025",
          scoringFormat: "ppr" as const,
          positions: ["all"],
          rankings: playerRankings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        }

        setEspnRankings([system])
        console.info(`Successfully loaded ${rankings.length} ESPN rankings`)
      } else {
        console.info("ESPN rankings not available - API may be blocked by CORS policy")
        setEspnRankings([])
      }
    } catch (error) {
      console.warn("ESPN rankings could not be loaded:", error instanceof Error ? error.message : error)
      setEspnRankings([])
    }
  }, [])


  const generateAiRankings = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`Generating AI rankings with historical data for ${selectedYear}${selectedWeek ? ` week ${selectedWeek}` : ''}`);
      const allRankings = getAllSystems();
      const aiService = new AIRankingsService();
      const aiSystem = await aiService.generateAIRankings(allRankings, {
        year: selectedYear,
        week: selectedWeek || undefined,
        useHistoricalData: true
      });
      setAiRankingSystem(aiSystem);
      setSelectedSource("ai");
      setSelectedSystem(aiSystem);
    } catch (error) {
      console.error("Error generating AI rankings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWeek]);

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
      .sort((a, b) => {
        // Custom sorting logic
        let compareValue = 0
        
        switch (sortBy) {
          case "rank":
            compareValue = a.rank - b.rank
            break
          case "name":
            compareValue = a.playerName.localeCompare(b.playerName)
            break
          case "position":
            compareValue = a.position.localeCompare(b.position)
            break
          case "team":
            compareValue = a.team.localeCompare(b.team)
            break
          case "projectedPoints":
            compareValue = (b.projectedPoints || 0) - (a.projectedPoints || 0) // Higher points first by default
            break
          default:
            compareValue = a.rank - b.rank
        }
        
        return sortDirection === "desc" ? -compareValue : compareValue
      })
  }, [selectedSystem, selectedPosition, getPlayer, sortBy, sortDirection])

  useEffect(() => {
    // Prevent multiple API calls in development mode (React StrictMode)
    if (Object.keys(players).length === 0) return;
    
    let cancelled = false;
    
    const loadAllRankings = async () => {
      if (cancelled) return;
      
      console.info("Loading rankings from external APIs...")
      setIsLoading(true)
      
      try {
        await Promise.allSettled([
          loadEspnRankings(),
        ])
        // After all initial rankings are loaded, generate AI rankings
        if (!cancelled) {
          await generateAiRankings();
          setSelectedSource("ai");
          setSelectedSystem(aiRankingSystem);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Some ranking APIs failed to load:", error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    
    // Debounce API calls to prevent rapid successive calls
    const timeoutId = setTimeout(loadAllRankings, 500)
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    }
  }, [players, apiKeys, loadEspnRankings, generateAiRankings])

  const getAllPositions = (): string[] => {
    const positions = new Set<string>()
    getAllSystems().forEach((system) => {
      system.positions.forEach((pos) => {
        // Only add valid, non-empty positions
        if (pos && typeof pos === 'string' && pos.trim() && pos.trim() !== "UNKNOWN" && pos.trim() !== "all") {
          positions.add(pos.trim())
        }
      })
    })
    return Array.from(positions).filter(pos => pos && pos.trim() && pos.trim().length > 0).sort()
  }

    const handleImportComplete = (newSystem: RankingSystem) => {
    console.log("Import complete, new system:", newSystem);
    const updatedSystems = [...userRankingSystems, newSystem]
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    console.log("Saved to localStorage:", JSON.stringify(updatedSystems));
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
    console.log('Refresh Rankings called, current API keys:', Object.keys(apiKeys))
    
    // Also try to reload API keys in case they were updated
    const savedKeys = localStorage.getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setApiKeys(keys)
        console.log('Reloaded API keys during refresh:', Object.keys(keys))
        
      } catch (e) {
        console.error("Failed to reload API keys:", e)
      }
    }
  }

  const getTierColor = (tier?: number) => {
    if (!tier) return "bg-gray-500";
    switch (tier) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-green-500";
      case 5: return "bg-blue-500";
      default: return "bg-purple-500";
    }
  };

  const handleTableSort = (field: string) => {
    if (tableSortField === field) {
      setTableSortDirection(tableSortDirection === "asc" ? "desc" : "asc")
    } else {
      setTableSortField(field)
      setTableSortDirection("asc")
    }
  };

  const sortTableData = (data: SimplePlayerRanking[]) => {
    return [...data].sort((a, b) => {
      let compareValue = 0;
      
      switch (tableSortField) {
        case "rank":
          compareValue = a.rank - b.rank;
          break;
        case "playerName":
          compareValue = a.playerName.localeCompare(b.playerName);
          break;
        case "position":
          compareValue = a.position.localeCompare(b.position);
          break;
        case "team":
          compareValue = a.team.localeCompare(b.team);
          break;
        case "projectedPoints":
          compareValue = (b.projectedPoints || 0) - (a.projectedPoints || 0);
          break;
        case "tier":
          compareValue = (a.tier || 999) - (b.tier || 999);
          break;
        default:
          compareValue = a.rank - b.rank;
      }
      
      return tableSortDirection === "desc" ? -compareValue : compareValue;
    });
  };

  const renderRankingsTable = (rankings: SimplePlayerRanking[]) => {
    const sortedData = sortTableData(rankings);
    
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("rank")}>
                  <div className="flex items-center gap-1">
                    Rank
                    {tableSortField === "rank" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("playerName")}>
                  <div className="flex items-center gap-1">
                    Player
                    {tableSortField === "playerName" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("position")}>
                  <div className="flex items-center gap-1">
                    Position
                    {tableSortField === "position" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("team")}>
                  <div className="flex items-center gap-1">
                    Team
                    {tableSortField === "team" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("projectedPoints")}>
                  <div className="flex items-center gap-1">
                    Projected Points
                    {tableSortField === "projectedPoints" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleTableSort("tier")}>
                  <div className="flex items-center gap-1">
                    Tier
                    {tableSortField === "tier" ? (
                      tableSortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium">
                  Status
                </th>
                <th className="text-left p-2 font-medium">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((player, index) => (
                <tr key={player.playerId} 
                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlayerForModal(player)}>
                  <td className="p-2">
                    <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold ${getTierColor(player.tier)}`}>
                      {player.rank}
                    </div>
                  </td>
                  <td className="p-2 font-medium">
                    {player.playerName}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-xs">
                      {player.position}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {player.team}
                  </td>
                  <td className="p-2 font-medium">
                    {player.projectedPoints ? `${player.projectedPoints.toFixed(1)} pts` : '-'}
                  </td>
                  <td className="p-2">
                    {player.tier ? `Tier ${player.tier}` : '-'}
                  </td>
                  <td className="p-2">
                    {player.injuryStatus && player.injuryStatus !== "Healthy" ? (
                      <Badge variant="destructive" className="text-xs">
                        {player.injuryStatus}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Healthy
                      </Badge>
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {player.notes ? player.notes.slice(0, 50) + (player.notes.length > 50 ? '...' : '') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const hasNoDataSources = userRankingSystems.length === 0

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Player Rankings</h1>
            <p className="text-muted-foreground">AI-generated rankings with historical NFL data, plus user imports and external sources</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshRankings} disabled={isLoading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {isLoading ? "Loading..." : "Refresh Rankings"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('=== DEBUG INFO ===')
                console.log('Current API Keys state:', apiKeys)
                console.log('localStorage content:', localStorage.getItem("fantasy_api_keys"))
                console.log('All systems count:', getAllSystems().length)
                console.log('================')
              }}
            >
              Debug Info
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
                    Import your own rankings to see player data. This application uses
                    real data from external sources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasNoDataSources && getAllSystems().length === 0 && !isLoading && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">External APIs Not Available</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    ESPN API is currently unavailable. Please:
                  </p>
                  <ul className="text-sm text-muted-foreground mb-3 list-disc list-inside space-y-1">
                    <li>Enter it in the &quot;API Keys&quot; tab below</li>
                    <li>Or use the demo data to test functionality</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Create demo data to show functionality
                      const demoSystem: RankingSystem = {
                        id: 'demo-rankings',
                        name: 'Demo Rankings (Sample Data)',
                        description: 'Sample fantasy football rankings to demonstrate functionality',
                        source: 'Demo',
                        season: '2025',
                        scoringFormat: 'ppr',
                        positions: ['QB', 'RB', 'WR', 'TE'],
                        rankings: [
                          { rank: 1, playerId: 'demo-1', playerName: 'Josh Allen', position: 'QB', team: 'BUF', projectedPoints: 382.5 },
                          { rank: 2, playerId: 'demo-2', playerName: 'Christian McCaffrey', position: 'RB', team: 'SF', projectedPoints: 345.2 },
                          { rank: 3, playerId: 'demo-3', playerName: 'Justin Jefferson', position: 'WR', team: 'MIN', projectedPoints: 298.7 },
                          { rank: 4, playerId: 'demo-4', playerName: 'Travis Kelce', position: 'TE', team: 'KC', projectedPoints: 267.3 },
                          { rank: 5, playerId: 'demo-5', playerName: 'Tyreek Hill', position: 'WR', team: 'MIA', projectedPoints: 289.1 },
                          { rank: 6, playerId: 'demo-6', playerName: 'Saquon Barkley', position: 'RB', team: 'PHI', projectedPoints: 312.8 },
                          { rank: 7, playerId: 'demo-7', playerName: 'CeeDee Lamb', position: 'WR', team: 'DAL', projectedPoints: 276.4 },
                          { rank: 8, playerId: 'demo-8', playerName: 'Lamar Jackson', position: 'QB', team: 'BAL', projectedPoints: 358.9 },
                        ],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                      }
                      setUserRankingSystems([demoSystem])
                      setSelectedSystem(demoSystem)
                    }}
                  >
                    Load Demo Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ranking Filters & Sorting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ranking Source</label>
                <Select value={selectedSource} onValueChange={(value: RankingSource) => setSelectedSource(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="user">User Imported</SelectItem>
                    <SelectItem value="espn">ESPN</SelectItem>
                    <SelectItem value="ai">AI Generated</SelectItem>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: "rank" | "name" | "position" | "team" | "projectedPoints") => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Rank</SelectItem>
                    <SelectItem value="name">Player Name</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="projectedPoints">Projected Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort Direction</label>
                <Select value={sortDirection} onValueChange={(value: "asc" | "desc") => setSortDirection(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Historical Data Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Rankings Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Historical Year</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024 Season</SelectItem>
                    <SelectItem value="2023">2023 Season</SelectItem>
                    <SelectItem value="2022">2022 Season</SelectItem>
                    <SelectItem value="2021">2021 Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Week (Optional)</label>
                <Select 
                  value={selectedWeek?.toString() || "all"} 
                  onValueChange={(value) => setSelectedWeek(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All weeks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks (Season)</SelectItem>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={generateAiRankings} disabled={isLoading} className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  {isLoading ? "Analyzing..." : "Generate AI Rankings"}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p><strong>Historical Data Integration:</strong> AI rankings now use real NFL performance data from the selected year/week to provide context alongside your imported rankings. This helps identify players with strong historical performance that might be undervalued in current rankings.</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{userRankingSystems.length}</p>
                    <p className="text-sm text-muted-foreground">User Imported</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{espnRankings.length}</p>
                    <p className="text-sm text-muted-foreground">External APIs</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {isLoading ? "Loading..." : "Available"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{filteredRankings.length}</p>
                  <p className="text-sm text-muted-foreground">Filtered Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rankings Data Display */}
        {selectedSystem && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Player Rankings Results
                </CardTitle>
                <Badge variant="outline">
                  {selectedSystem.source} • {filteredRankings.length} players
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{filteredRankings.length}</div>
                    <p className="text-sm text-muted-foreground">Total Players</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {selectedSystem.source === 'AI' && selectedYear ? selectedYear : selectedSystem.season}
                    </div>
                    <p className="text-sm text-muted-foreground">Season/Year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedSystem.scoringFormat.toUpperCase()}</div>
                    <p className="text-sm text-muted-foreground">Scoring Format</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedPosition === "all" ? "All" : selectedPosition}</div>
                    <p className="text-sm text-muted-foreground">Position Filter</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rankings Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {selectedSystem.name} - {selectedPosition === "all" ? "All Positions" : selectedPosition}
                  </h3>
                  {selectedSystem.source === 'AI' && (
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">
                      ✨ Enhanced with NFL historical data
                    </div>
                  )}
                </div>

                {playersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading player data...</p>
                    </div>
                  </div>
                ) : filteredRankings.length > 0 ? (
                  renderRankingsTable(filteredRankings)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No rankings found for the selected filters.
                    </p>
                  </div>
                )}
              </div>
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
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">After Setting API Keys:</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                Once you&apos;ve entered and tested your API keys, click &quot;Refresh Rankings&quot; above to load data.
              </p>
              <Button onClick={refreshRankings} disabled={isLoading} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                {isLoading ? "Loading..." : "Refresh Rankings Now"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedPlayerForModal && (
        <PlayerDetailModal player={selectedPlayerForModal} onClose={() => setSelectedPlayerForModal(null)} />
      )}
    </div>
  )
}