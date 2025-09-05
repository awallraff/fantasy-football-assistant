"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Database, RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"

interface TestResult {
  success: boolean
  message: string
}

export function NFLDataManager() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [nflData, setNflData] = useState<NFLDataResponse | null>(null)
  const [selectedYears, setSelectedYears] = useState<string[]>(["2024"])
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["QB", "RB", "WR", "TE"])
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>("ALL")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")
  const [searchPlayerName, setSearchPlayerName] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [minFantasyPoints, setMinFantasyPoints] = useState<string>("")
  // Removed unused expandedPlayers state
  const [sortField, setSortField] = useState<string>("fantasy_points_ppr")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "player_name", "position", "team", "fantasy_points_ppr", "targets", "receptions", 
    "receiving_yards", "receiving_tds", "rushing_attempts", "rushing_yards", "rushing_tds",
    "passing_yards", "passing_tds", "interceptions"
  ])
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const availablePositions = ["ALL", "QB", "RB", "WR", "TE"]
  const availableWeeks = Array.from({ length: 18 }, (_, i) => i + 1)
  const nflTeams = [
    "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN",
    "DET", "GB", "HOU", "IND", "JAX", "KC", "LV", "LAC", "LAR", "MIA",
    "MIN", "NE", "NO", "NYG", "NYJ", "PHI", "PIT", "SF", "SEA", "TB",
    "TEN", "WAS"
  ]

  // Removed unused togglePlayerExpansion function

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortData = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return []
    
    return [...data].sort((a, b) => {
      let aVal = a?.[sortField]
      let bVal = b?.[sortField]
      
      // Handle undefined/null values
      if (aVal === undefined || aVal === null) aVal = ""
      if (bVal === undefined || bVal === null) bVal = ""
      
      // Handle string columns (player_name, position, team, etc.)
      if (sortField === "player_name" || sortField === "position" || sortField === "team") {
        const aStr = String(aVal).toLowerCase().trim()
        const bStr = String(bVal).toLowerCase().trim()
        
        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      }
      
      // Handle numeric columns
      const aNum = Number(aVal) || 0
      const bNum = Number(bVal) || 0
      
      // For descending sort
      if (sortDirection === "desc") {
        // Put 0 values at the bottom for fantasy points and stats
        if (sortField.includes("fantasy") || sortField.includes("points") || sortField.includes("yards") || sortField.includes("tds")) {
          if (aNum === 0 && bNum !== 0) return 1
          if (bNum === 0 && aNum !== 0) return -1
        }
        return bNum - aNum
      } else {
        // For ascending sort
        if (sortField.includes("fantasy") || sortField.includes("points") || sortField.includes("yards") || sortField.includes("tds")) {
          if (aNum === 0 && bNum !== 0) return 1
          if (bNum === 0 && aNum !== 0) return -1
        }
        return aNum - bNum
      }
    })
  }

  const availableDataFields = [
    // Core identifiers
    { key: "player_name", label: "Player Name" },
    { key: "position", label: "Position" },
    { key: "team", label: "Team" },
    { key: "season", label: "Season" },
    { key: "week", label: "Week" },
    { key: "games", label: "Games" },
    
    // Fantasy scoring
    { key: "fantasy_points_ppr", label: "PPR Points" },
    { key: "fantasy_points", label: "Standard Points" },
    { key: "fantasy_points_ppr_per_game", label: "PPR Per Game" },
    { key: "fantasy_points_per_game", label: "STD Per Game" },
    
    // Passing metrics (QB focus)
    { key: "passing_yards", label: "Pass Yards" },
    { key: "passing_tds", label: "Pass TDs" },
    { key: "interceptions", label: "Interceptions" },
    { key: "passing_attempts", label: "Pass Attempts" },
    { key: "completions", label: "Completions" },
    { key: "passing_air_yards", label: "Pass Air Yards" },
    { key: "passing_yards_after_catch", label: "Pass YAC" },
    { key: "passing_first_downs", label: "Pass First Downs" },
    { key: "passing_epa", label: "Pass EPA" },
    { key: "dakota", label: "Dakota Rating" },
    { key: "completion_rate", label: "Completion %" },
    
    // Rushing metrics (RB/QB focus)
    { key: "rushing_yards", label: "Rush Yards" },
    { key: "rushing_tds", label: "Rush TDs" },
    { key: "rushing_attempts", label: "Rush Attempts" },
    { key: "carries", label: "Carries" },
    { key: "rushing_first_downs", label: "Rush First Downs" },
    { key: "rushing_epa", label: "Rush EPA" },
    { key: "rushing_yards_after_contact", label: "Rush YAC" },
    { key: "yards_per_carry", label: "YPC" },
    
    // Receiving metrics (WR/TE/RB focus)
    { key: "receiving_yards", label: "Rec Yards" },
    { key: "receiving_tds", label: "Rec TDs" },
    { key: "receptions", label: "Receptions" },
    { key: "targets", label: "Targets" },
    { key: "receiving_air_yards", label: "Rec Air Yards" },
    { key: "receiving_yards_after_catch", label: "Rec YAC" },
    { key: "receiving_first_downs", label: "Rec First Downs" },
    { key: "receiving_epa", label: "Rec EPA" },
    { key: "target_share", label: "Target Share %" },
    { key: "catch_rate", label: "Catch Rate %" },
    { key: "yards_per_target", label: "Yards/Target" },
    { key: "yards_per_reception", label: "Yards/Reception" },
    
    // Advanced metrics
    { key: "red_zone_touches", label: "RZ Touches" },
    { key: "red_zone_targets", label: "RZ Targets" },
    { key: "red_zone_carries", label: "RZ Carries" },
    { key: "snap_counts", label: "Snap Counts" },
    { key: "snap_count_pct", label: "Snap %" },
    { key: "air_yards_share", label: "Air Yards Share %" },
    { key: "wopr", label: "WOPR" },
    { key: "racr", label: "RACR" },
    
    // Share metrics
    { key: "tgt_sh", label: "Target Share" },
    { key: "ay_sh", label: "Air Yards Share" },
    { key: "yac_sh", label: "YAC Share" },
    { key: "ry_sh", label: "Rec Yards Share" },
    { key: "rtd_sh", label: "Rec TD Share" },
    { key: "rfd_sh", label: "Rec FD Share" },
    { key: "rtdfd_sh", label: "Rec TD+FD Share" },
    { key: "dom", label: "Dominator" },
    { key: "w8dom", label: "Weighted Dom" },
    { key: "yptmpa", label: "Yards/Team Pass Att" },
    { key: "ppr_sh", label: "PPR Share" }
  ]

  const testConnection = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/nfl-data?action=test')
      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection')
      setTestResult({ success: false, message: 'Connection failed' })
    } finally {
      setLoading(false)
    }
  }, [])

  const extractNFLData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        action: 'extract',
        years: selectedYears.join(','),
        positions: selectedPositions.join(',')
      })
      
      if (selectedWeek && selectedWeek !== "all") {
        params.set('week', selectedWeek)
      }
      
      const response = await fetch(`/api/nfl-data?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setNflData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract NFL data')
    } finally {
      setLoading(false)
    }
  }, [selectedYears, selectedPositions, selectedWeek])

  const searchPlayer = useCallback(async () => {
    if (!searchPlayerName.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        action: 'extract',
        years: selectedYears.join(','),
        positions: selectedPositions.join(',')
      })
      
      const response = await fetch(`/api/nfl-data?${params}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Filter data to show only the searched player
      const playerName = searchPlayerName.trim().toLowerCase()
      const filteredData = {
        ...data,
        weekly_stats: data.weekly_stats.filter((stat: Record<string, unknown>) => {
          const playerName = stat.player_name as string
          return playerName?.toLowerCase().includes(searchPlayerName.toLowerCase())
        }),
        seasonal_stats: data.seasonal_stats.filter((stat: Record<string, unknown>) => {
          const playerName = stat.player_name as string
          return playerName?.toLowerCase().includes(searchPlayerName.toLowerCase())
        }),
        aggregated_season_stats: data.aggregated_season_stats?.filter((stat: Record<string, unknown>) => {
          const playerName = stat.player_name as string
          return playerName?.toLowerCase().includes(searchPlayerName.toLowerCase())
        }) || [],
        player_info: data.player_info.filter((player: Record<string, unknown>) => {
          const playerName = player.player_name as string
          return playerName?.toLowerCase().includes(searchPlayerName.toLowerCase())
        })
      }
      
      setNflData(filteredData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search player')
    } finally {
      setLoading(false)
    }
  }, [searchPlayerName, selectedYears, selectedPositions])

  const exportData = useCallback(() => {
    if (!nflData) return
    
    const dataStr = JSON.stringify(nflData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `nfl-data-${selectedYears.join('-')}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [nflData, selectedYears])

  // Auto-load 2024 data on component mount
  useEffect(() => {
    const autoLoadData = async () => {
      // Only auto-load if no data is currently loaded
      if (!nflData && !loading) {
        console.log("Auto-loading 2024 NFL data...")
        try {
          await extractNFLData()
        } catch (error) {
          console.error("Failed to auto-load data:", error)
        }
      }
    }
    
    autoLoadData()
  }, [extractNFLData, loading, nflData])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            NFL Data Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Test */}
          <div className="flex items-center gap-4">
            <Button onClick={testConnection} disabled={loading} variant="outline">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            {testResult && (
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {testResult.message}
              </Badge>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {/* Data Extraction Controls */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Years</label>
                <Select
                  value={selectedYears.length === 1 ? selectedYears[0] : ""}
                  onValueChange={(value) => setSelectedYears([value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableYears || []).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Positions</label>
                <Select
                  value={selectedPositionFilter}
                  onValueChange={(value) => {
                    setSelectedPositionFilter(value)
                    if (value === "ALL") {
                      setSelectedPositions(["QB", "RB", "WR", "TE"])
                    } else {
                      setSelectedPositions([value])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select positions" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availablePositions || []).map(position => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Week (Optional)</label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="All weeks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All weeks</SelectItem>
                    {(availableWeeks || []).map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Team (Optional)</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {(nflTeams || []).map(team => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filtering */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Min Fantasy Points:</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minFantasyPoints}
                  onChange={(e) => setMinFantasyPoints(e.target.value)}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Display Columns:</label>
                <Select value="" onValueChange={(field) => {
                  if (!(selectedColumns || []).includes(field)) {
                    setSelectedColumns([...(selectedColumns || []), field])
                  }
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataFields
                      .filter(field => !(selectedColumns || []).includes(field.key))
                      .map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={extractNFLData} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Extract Data
              </Button>
            </div>
          </div>

          {/* Player Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter player name to search..."
              value={searchPlayerName}
              onChange={(e) => setSearchPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlayer()}
            />
            <Button onClick={searchPlayer} disabled={loading || !searchPlayerName.trim()}>
              Search Player
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      {nflData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>NFL Data Results</CardTitle>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{nflData.metadata.total_players}</div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{nflData.metadata.total_weekly_records}</div>
                  <p className="text-sm text-muted-foreground">Weekly Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{nflData.metadata.total_seasonal_records}</div>
                  <p className="text-sm text-muted-foreground">Seasonal Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{nflData.metadata.total_aggregated_records || 0}</div>
                  <p className="text-sm text-muted-foreground">Aggregated Records</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="aggregated" className="space-y-4">
              <TabsList>
                <TabsTrigger value="weekly">Weekly Stats</TabsTrigger>
                <TabsTrigger value="aggregated">Season Totals</TabsTrigger>
                <TabsTrigger value="players">Player Info</TabsTrigger>
                <TabsTrigger value="teams">Team Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly">
                <div className="space-y-4">
                  {/* Column Management */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Active Columns:</span>
                    {(selectedColumns || []).map(col => {
                      const field = (availableDataFields || []).find(f => f.key === col)
                      return field ? (
                        <Badge key={col} variant="secondary" className="cursor-pointer" onClick={() => {
                          setSelectedColumns((selectedColumns || []).filter(c => c !== col))
                        }}>
                          {field.label} ×
                        </Badge>
                      ) : null
                    })}
                  </div>
                  
                  {/* Sortable Table */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                                onClick={() => handleSort("week")}>
                              <div className="flex items-center gap-1">
                                Week
                                {sortField === "week" ? (
                                  sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 opacity-40" />
                                )}
                              </div>
                            </th>
                            {(selectedColumns || []).map(col => {
                              const field = (availableDataFields || []).find(f => f.key === col)
                              if (!field) return null
                              
                              return (
                                <th key={col} className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort(col)}>
                                  <div className="flex items-center gap-1">
                                    {field.label}
                                    {sortField === col ? (
                                      sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                                    )}
                                  </div>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(
                            ((nflData.weekly_stats as unknown as Record<string, unknown>[]) || [])
                              .filter(stat => {
                                if (!stat) return false
                                if (selectedTeam !== "all" && stat.team !== selectedTeam) return false
                                if (selectedPositionFilter !== "ALL" && stat.position !== selectedPositionFilter) return false
                                if (minFantasyPoints && ((stat.fantasy_points_ppr as number) || (stat.fantasy_points as number) || 0) < parseFloat(minFantasyPoints)) return false
                                return true
                              })
                          ).slice(0, 100).filter(stat => stat && typeof stat === 'object').map((stat, index) => (
                            <tr key={`${stat?.player_id || index}_${stat?.week || 'unknown'}_${stat?.season || 'unknown'}`} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-2">
                                Week {String((stat as unknown as Record<string, unknown>)?.week || 'N/A')}
                              </td>
                              {(selectedColumns || []).map(col => {
                                const field = (availableDataFields || []).find(f => f.key === col)
                                if (!field) return null
                                
                                let value = stat?.[col]
                                
                                // Handle undefined/null values
                                if (value === undefined || value === null) {
                                  value = 0
                                }
                                
                                // Format different data types
                                if (typeof value === "number") {
                                  if (col.includes("rate") || col.includes("share") || col.includes("percentage")) {
                                    value = `${value.toFixed(1)}%`
                                  } else if (col.includes("per_game") || col.includes("yards_per") || col.includes("epa")) {
                                    value = value.toFixed(1)
                                  } else if (col.includes("points")) {
                                    value = value.toFixed(1)
                                  } else {
                                    value = Math.round(value)
                                  }
                                }
                                
                                return (
                                  <td key={col} className="p-2">
                                    {String(value || 0)}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {nflData.weekly_stats.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No weekly stats available.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>


              <TabsContent value="aggregated">
                <div className="space-y-4">
                  {/* Column Management */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Active Columns:</span>
                    {(selectedColumns || []).map(col => {
                      const field = (availableDataFields || []).find(f => f.key === col)
                      return field ? (
                        <Badge key={col} variant="secondary" className="cursor-pointer" onClick={() => {
                          setSelectedColumns((selectedColumns || []).filter(c => c !== col))
                        }}>
                          {field.label} ×
                        </Badge>
                      ) : null
                    })}
                  </div>
                  
                  {/* Sortable Table */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b sticky top-0">
                          <tr>
                            {(selectedColumns || []).map(col => {
                              const field = (availableDataFields || []).find(f => f.key === col)
                              if (!field) return null
                              
                              return (
                                <th key={col} className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort(col)}>
                                  <div className="flex items-center gap-1">
                                    {field.label}
                                    {sortField === col ? (
                                      sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                                    )}
                                  </div>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(
                            ((nflData.aggregated_season_stats as unknown as Record<string, unknown>[]) || [])
                              .filter(stat => {
                                if (!stat) return false
                                if (selectedTeam !== "all" && stat.team !== selectedTeam) return false
                                if (selectedPositionFilter !== "ALL" && stat.position !== selectedPositionFilter) return false
                                if (minFantasyPoints && (Number((stat as unknown as Record<string, unknown>).fantasy_points_ppr) || Number((stat as unknown as Record<string, unknown>).fantasy_points) || 0) < parseFloat(minFantasyPoints)) return false
                                return true
                              })
                          ).slice(0, 100).filter(stat => stat && typeof stat === 'object').map((stat, index) => (
                            <tr key={`${stat?.player_id || index}_${stat?.season || 'unknown'}`} className="border-b hover:bg-muted/30 transition-colors">
                              {(selectedColumns || []).map(col => {
                                const field = (availableDataFields || []).find(f => f.key === col)
                                if (!field) return null
                                
                                let value = stat?.[col]
                                
                                // Handle undefined/null values
                                if (value === undefined || value === null) {
                                  value = 0
                                }
                                
                                // Format different data types
                                if (typeof value === "number") {
                                  if (col.includes("rate") || col.includes("share") || col.includes("percentage")) {
                                    value = `${value.toFixed(1)}%`
                                  } else if (col.includes("per_game") || col.includes("yards_per") || col.includes("epa")) {
                                    value = value.toFixed(1)
                                  } else if (col.includes("points")) {
                                    value = value.toFixed(1)
                                  } else {
                                    value = Math.round(value)
                                  }
                                }
                                
                                return (
                                  <td key={col} className="p-2">
                                    {String(value || 0)}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {(!nflData.aggregated_season_stats || nflData.aggregated_season_stats.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No aggregated season stats available. Try selecting &quot;All weeks&quot; to see season totals.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="players">
                <div className="h-96 w-full border rounded-md p-4 overflow-y-auto">
                  <div className="space-y-2">
                    {(nflData.player_info || []).slice(0, 50).filter(player => player && typeof player === 'object').map((player, index) => (
                      <div key={`player-${player?.player_id || index}`} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{player?.player_name || 'Unknown Player'}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {player?.position || 'N/A'} - {player?.team || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            #{player?.jersey_number || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player?.college || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {nflData.player_info.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        ... and {nflData.player_info.length - 50} more records
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teams">
                <div className="h-96 w-full border rounded-md p-4 overflow-y-auto">
                  <div className="space-y-2">
                    {(nflData.team_analytics || []).slice(0, 32).filter(team => team && typeof team === 'object').map((team, index) => (
                      <div key={`team-${team?.team || index}`} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {team?.team || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">{team?.team || 'Unknown'} Offense</span>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant={
                                  team?.offensive_identity === 'Pass-Heavy' ? 'default' :
                                  team?.offensive_identity === 'Run-Heavy' ? 'secondary' : 'outline'
                                }>
                                  {team?.offensive_identity || 'Unknown'}
                                </Badge>
                                <span>{(team?.passing_percentage || 0).toFixed(1)}% Pass</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {(team?.total_fantasy_points_ppr || 0).toFixed(1)} Total PPR
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(team?.passing_yards || 0) + (team?.rushing_yards || 0)} Total Yards
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">QB PPR</div>
                              <div className="font-medium">{(team?.qb_fantasy_points || 0).toFixed(1)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">RB PPR</div>
                              <div className="font-medium">{(team?.rb_fantasy_points || 0).toFixed(1)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">WR PPR</div>
                              <div className="font-medium">{(team?.wr_fantasy_points || 0).toFixed(1)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">TE PPR</div>
                              <div className="font-medium">{(team?.te_fantasy_points || 0).toFixed(1)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">RB Touches</div>
                              <div className="font-medium">{team?.rb_touches || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">WR Targets</div>
                              <div className="font-medium">{team?.wr_targets || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">TE Targets</div>
                              <div className="font-medium">{team?.te_targets || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">YPC</div>
                              <div className="font-medium">{(team?.yards_per_carry || 0).toFixed(1)}</div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}