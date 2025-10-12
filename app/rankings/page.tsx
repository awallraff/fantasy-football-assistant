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
import type { RankingSystem } from "@/lib/rankings-types";
import { usePlayerData } from "@/contexts/player-data-context"
import { normalizePosition } from "@/lib/player-utils"
import { AIRankingsService } from "@/lib/ai-rankings-service"
import { getNextUpcomingWeek } from "@/lib/nfl-season-utils"
import { getTierColor } from "@/lib/ranking-utils"
import { debugLog, debugInfo, debugError } from "@/lib/debug-utils"
import { API_DEBOUNCE_TIMEOUT_MS } from "@/lib/constants/rankings"

type RankingSource = "all" | "user" | "ai"

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
  const [aiRankingSystem, setAiRankingSystem] = useState<RankingSystem | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<RankingSystem | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<RankingSource>("ai")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<SimplePlayerRanking | null>(null)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [projectionType, setProjectionType] = useState<"season" | "weekly">("weekly")
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
        debugLog("Loaded from localStorage:", systems);
      } catch (e) {
        debugError("Failed to load rankings:", e)
      }
    }

    // Load API keys
    const savedKeys = getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setApiKeys(keys)
        debugLog('Loaded API keys from localStorage:', Object.keys(keys))

      } catch (e) {
        debugError("Failed to load API keys:", e)
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
          debugLog('API keys updated from storage event:', Object.keys(keys))
        } catch (e) {
          debugError("Failed to parse updated API keys:", e)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isClient])

  const getAllSystems = useCallback((): RankingSystem[] => {
    switch (selectedSource) {
      case "user":
        return userRankingSystems
      case "ai":
        return aiRankingSystem ? [aiRankingSystem] : []
      default:
        return [...userRankingSystems]
    }
  }, [selectedSource, userRankingSystems, aiRankingSystem])

  const getAllSystemsForSource = (source: RankingSource): RankingSystem[] => {
    switch (source) {
      case "user":
        return userRankingSystems
      case "ai":
        return aiRankingSystem ? [aiRankingSystem] : []
      default:
        return [...userRankingSystems]
    }
  }

  // Auto-select system when switching sources and systems are available
  useEffect(() => {
    const availableSystems = getAllSystems();
    
    // If no system is selected but systems are available for the current source, auto-select the most recent
    if (!selectedSystem && availableSystems.length > 0) {
      const mostRecentSystem = availableSystems.reduce((latest, current) => {
        const latestTime = new Date(latest.updatedAt || latest.createdAt || 0).getTime();
        const currentTime = new Date(current.updatedAt || current.createdAt || 0).getTime();
        return currentTime > latestTime ? current : latest;
      });
      setSelectedSystem(mostRecentSystem);
    }
    
    // If selected system doesn't belong to current source, clear selection
    if (selectedSystem && !availableSystems.some(sys => sys.id === selectedSystem.id)) {
      setSelectedSystem(null);
    }
  }, [selectedSource, userRankingSystems, aiRankingSystem, selectedSystem, getAllSystems])






  const generateAiRankings = useCallback(async (customYear?: number, customWeek?: number, forceProjectionType?: "season" | "weekly") => {
    const { year: nextYear, week: nextWeek } = getNextUpcomingWeek();
    const targetYear = customYear || nextYear;
    const currentProjectionType = forceProjectionType || projectionType;
    
    // For season projections, don't specify a week
    const targetWeek = currentProjectionType === "season" ? undefined : (customWeek || nextWeek);
    
    setIsLoading(true);
    try {
      const projectionDesc = currentProjectionType === "season" ? `${targetYear} season` : `Week ${targetWeek} of ${targetYear}`;
      debugInfo(`Generating AI rankings predictions for ${projectionDesc}`);
      const allRankings = getAllSystems();
      const aiService = new AIRankingsService();
      const aiSystem = await aiService.generateAIRankings(allRankings, {
        year: targetYear,
        week: targetWeek,
        useHistoricalData: true // Use historical data to inform future predictions
      });
      setAiRankingSystem(aiSystem);
      setSelectedSource("ai");
      setSelectedSystem(aiSystem);
      
      // Update the state to reflect what we generated
      setSelectedYear(targetYear);
      setSelectedWeek(targetWeek || null);
    } catch (error) {
      debugError("Error generating AI rankings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectionType, getAllSystems]);

  const handleProjectionTypeChange = useCallback(async (newType: "season" | "weekly") => {
    setProjectionType(newType);
    // Regenerate AI rankings with the new projection type
    if (selectedSource === "ai" || aiRankingSystem) {
      await generateAiRankings(selectedYear, selectedWeek || undefined, newType);
    }
  }, [selectedSource, aiRankingSystem, selectedYear, selectedWeek, generateAiRankings]);

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
      // Remove the duplicate sorting here - let the table handle all sorting
  }, [selectedSystem, selectedPosition, getPlayer])

  useEffect(() => {
    // Prevent multiple API calls in development mode (React StrictMode)
    if (Object.keys(players).length === 0) return;
    
    // Only generate AI rankings once when players are first loaded
    if (aiRankingSystem) return;
    
    let cancelled = false;
    
    const loadAllRankings = async () => {
      if (cancelled) return;

      debugInfo("Loading rankings from external APIs...")
      setIsLoading(true)
      
      try {
        // After all initial rankings are loaded, automatically generate AI rankings for next upcoming week
        if (!cancelled) {
          const { year: nextYear, week: nextWeek } = getNextUpcomingWeek();
          const targetYear = nextYear;
          const currentProjectionType = projectionType;
          
          // For season projections, don't specify a week
          const targetWeek = currentProjectionType === "season" ? undefined : nextWeek;

          debugInfo(`Generating AI rankings predictions for ${currentProjectionType === "season" ? `${targetYear} season` : `Week ${targetWeek} of ${targetYear}`}`);
          const allRankings = getAllSystems();
          const aiService = new AIRankingsService();
          const aiSystem = await aiService.generateAIRankings(allRankings, {
            year: targetYear,
            week: targetWeek,
            useHistoricalData: true // Use historical data to inform future predictions
          });
          setAiRankingSystem(aiSystem);
          setSelectedSource("ai");
          setSelectedSystem(aiSystem);
          
          // Update the state to reflect what we generated
          setSelectedYear(targetYear);
          setSelectedWeek(targetWeek || null);
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
    const timeoutId = setTimeout(loadAllRankings, API_DEBOUNCE_TIMEOUT_MS)
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    }
  }, [players, apiKeys, aiRankingSystem, getAllSystems, projectionType]);

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
    debugLog("Import complete, new system:", newSystem);
    const updatedSystems = [...userRankingSystems, newSystem]
    setUserRankingSystems(updatedSystems)
    setItem("ranking_systems", JSON.stringify(updatedSystems))
    debugLog("Saved to localStorage:", JSON.stringify(updatedSystems));
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
    debugLog('Refresh Rankings called, current API keys:', Object.keys(apiKeys))

    // Also try to reload API keys in case they were updated
    const savedKeys = localStorage.getItem("fantasy_api_keys")
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setApiKeys(keys)
        debugLog('Reloaded API keys during refresh:', Object.keys(keys))

      } catch (e) {
        debugError("Failed to reload API keys:", e)
      }
    }
  }


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
          const aPoints = a.projectedPoints || 0;
          const bPoints = b.projectedPoints || 0;
          
          // For descending sort (default for points), put 0 values at bottom
          if (tableSortDirection === "desc") {
            if (aPoints === 0 && bPoints !== 0) return 1;
            if (bPoints === 0 && aPoints !== 0) return -1;
            return bPoints - aPoints;
          } else {
            // For ascending sort, 0 values stay at bottom
            if (aPoints === 0 && bPoints !== 0) return 1;
            if (bPoints === 0 && aPoints !== 0) return -1;
            return aPoints - bPoints;
          }
        case "tier":
          const aTier = a.tier || 999;
          const bTier = b.tier || 999;
          
          // For descending sort, put high tier numbers (999) at bottom
          if (tableSortDirection === "desc") {
            if (aTier === 999 && bTier !== 999) return 1;
            if (bTier === 999 && aTier !== 999) return -1;
            return bTier - aTier;
          } else {
            return aTier - bTier;
          }
        default:
          compareValue = a.rank - b.rank;
      }
      
      return tableSortDirection === "desc" ? -compareValue : compareValue;
    });
  };

  const renderRankingsTable = (rankings: SimplePlayerRanking[]) => {
    const sortedData = sortTableData(rankings);

    return (
      <>
        {/* Mobile: Card layout */}
        <div className="md:hidden space-y-2">
          {sortedData.map((player) => (
            <Card
              key={player.playerId}
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setSelectedPlayerForModal(player)}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 min-w-[44px] min-h-[44px] text-white rounded-full flex items-center justify-center text-sm font-bold ${getTierColor(player.tier)}`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-semibold">{player.playerName}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{player.position}</Badge>
                        <span className="text-sm text-muted-foreground">{player.team}</span>
                      </div>
                    </div>
                  </div>
                  {player.tier && (
                    <Badge variant="secondary" className="text-xs">Tier {player.tier}</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-muted-foreground">Projected: </span>
                    <span className="font-medium">{player.projectedPoints ? `${player.projectedPoints.toFixed(1)} pts` : '-'}</span>
                  </div>
                  <div>
                    {player.injuryStatus && player.injuryStatus !== "Healthy" ? (
                      <Badge variant="destructive" className="text-xs">{player.injuryStatus}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Healthy</Badge>
                    )}
                  </div>
                </div>
                {player.notes && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    {player.notes}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden md:block border rounded-md overflow-hidden">
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
                {sortedData.map((player) => (
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
      </>
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
            <p className="text-muted-foreground">Auto-generated AI predictions for the next upcoming NFL week, plus real data from user imports and external sources</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshRankings} disabled={isLoading} className="min-h-[44px]">
              <TrendingUp className="h-4 w-4 mr-2" />
              {isLoading ? "Loading..." : "Refresh Rankings"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                debugLog('=== DEBUG INFO ===')
                debugLog('Current API Keys state:', apiKeys)
                debugLog('localStorage content:', localStorage.getItem("fantasy_api_keys"))
                debugLog('All systems count:', getAllSystems().length)
                debugLog('================')
              }}
              className="min-h-[44px]"
            >
              Debug Info
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
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
                    External APIs are currently unavailable. Please:
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ranking Source</label>
                <Select value={selectedSource} onValueChange={(value: RankingSource) => {
                  setSelectedSource(value);
                  // Auto-select the most recent/relevant system for the new source
                  const newSourceSystems = getAllSystemsForSource(value);
                  if (newSourceSystems.length > 0) {
                    // Pick the most recent system from the new source
                    const mostRecentSystem = newSourceSystems.reduce((latest, current) => {
                      const latestTime = new Date(latest.updatedAt || latest.createdAt || 0).getTime();
                      const currentTime = new Date(current.updatedAt || current.createdAt || 0).getTime();
                      return currentTime > latestTime ? current : latest;
                    });
                    setSelectedSystem(mostRecentSystem);
                  } else {
                    setSelectedSystem(null);
                  }
                }}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="user">User Imported</SelectItem>
                    <SelectItem value="ai">AI Generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Position</label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="min-h-[44px]">
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
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder={getAllSystems().length > 0 ? "Select system" : "No systems available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllSystems().length > 0 ? (
                      getAllSystems().map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {selectedSource === "ai" ? "Generate AI rankings first" :
                         selectedSource === "user" ? "Import user rankings first" :
                         "No rankings available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">AI Projection Type</label>
                <Select
                  value={projectionType}
                  onValueChange={(value: "season" | "weekly") => handleProjectionTypeChange(value)}
                  disabled={selectedSource !== "ai" || isLoading}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Projections</SelectItem>
                    <SelectItem value="season">Season Projections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
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
                    <p className="text-2xl font-bold">0</p>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{filteredRankings.length}</div>
                    <p className="text-sm text-muted-foreground">Total Players</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {selectedSystem.source === 'AI' && selectedYear ? `${selectedYear}${selectedWeek ? ` W${selectedWeek}` : ''}` : selectedSystem.season}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedSystem.source === 'AI' ? 'Prediction Target' : 'Season/Year'}</p>
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
                      ✨ Auto-generated for {selectedYear} Week {selectedWeek || 1} using historical data
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
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">
                      {!selectedSystem ? (
                        selectedSource === "ai" ? "Generate AI rankings to see predictions" :
                        selectedSource === "user" ? "Import user rankings to see your data" :
                        "Select a ranking system to view results"
                      ) : filteredRankings.length === 0 ? (
                        selectedPosition !== "all" ? 
                          `No ${selectedPosition} rankings found in ${selectedSystem.name}` :
                          `No rankings found in ${selectedSystem.name}`
                      ) : "No rankings found for the selected filters."}
                    </p>
                    {!selectedSystem && (
                      <div className="text-sm text-muted-foreground">
                        {selectedSource === "ai" && "Click 'Generate AI Rankings' above to create predictions"}
                        {selectedSource === "user" && "Use the Import tab below to upload your rankings"}
                        {selectedSource === "all" && getAllSystems().length === 0 && "Import rankings or generate AI predictions to get started"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 min-h-[44px]">
            <TabsTrigger value="import" className="min-h-[44px]">Import</TabsTrigger>
            <TabsTrigger value="manage" className="min-h-[44px]">Manage</TabsTrigger>
            <TabsTrigger value="search" className="min-h-[44px]">Search</TabsTrigger>
            <TabsTrigger value="compare" className="min-h-[44px]">Compare</TabsTrigger>
            <TabsTrigger value="api-keys" className="min-h-[44px]">API Keys</TabsTrigger>
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
