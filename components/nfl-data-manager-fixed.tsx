"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Database, RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Info, ChevronDown, ChevronRight } from "lucide-react"
import type { NFLDataResponse } from "@/lib/nfl-data-service"

interface TestResult {
  success: boolean
  message: string
}

// Safe data rendering utility functions
const safeString = (value: unknown, fallback: string = 'N/A'): string => {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value
  const parsed = parseFloat(String(value))
  return isNaN(parsed) ? fallback : parsed
}

const formatValue = (value: unknown, field: string): string => {
  // Handle string fields (names, positions, teams, etc.)
  const stringFields = ["player_name", "player_id", "position", "team", "season", "week"]
  if (stringFields.includes(field)) {
    return safeString(value)
  }
  
  // Handle numeric fields
  const numValue = safeNumber(value)
  
  // Percentage fields
  if (field.includes("rate") || field.includes("share") || field.includes("percentage") || 
      field.includes("snap_count_pct") || field === "target_share" || field === "air_yards_share") {
    return `${numValue.toFixed(1)}%`
  } 
  // Per-game and efficiency metrics
  else if (field.includes("per_game") || field.includes("yards_per") || field.includes("epa") || 
           field === "wopr" || field === "racr" || field === "dakota") {
    return numValue.toFixed(1)
  } 
  // Fantasy points
  else if (field.includes("points")) {
    return numValue.toFixed(1)
  } 
  // Whole numbers
  else {
    return Math.round(numValue).toString()
  }
}

// Safe key generation
const generateSafeKey = (...parts: unknown[]): string => {
  return parts.map(part => safeString(part, 'unknown')).join('_')
}

export function NFLDataManagerFixed() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [nflData, setNflData] = useState<NFLDataResponse | null>(null)
  const [selectedYears, setSelectedYears] = useState<string[]>(["2024"])
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["QB", "RB", "WR", "TE"])
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>("ALL")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")
  // Removed unused searchPlayerName state
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [minFantasyPoints, setMinFantasyPoints] = useState<string>("")
  const [sortField, setSortField] = useState<string>("fantasy_points_ppr")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedColumns] = useState<string[]>([
    "player_name", "position", "team", "fantasy_points_ppr", "targets", "receptions", 
    "receiving_yards", "receiving_tds", "rushing_attempts", "rushing_yards", "rushing_tds",
    "passing_yards", "passing_tds", "interceptions"
  ])
  const [error, setError] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  // Constants with safe defaults
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

  const availableDataFields = [
    // Core identifiers
    { key: "player_name", label: "Player Name", category: "Identity" },
    { key: "player_id", label: "Player ID", category: "Identity" },
    { key: "position", label: "Position", category: "Identity" },
    { key: "team", label: "Team", category: "Identity" },
    { key: "season", label: "Season", category: "Identity" },
    { key: "week", label: "Week", category: "Identity" },
    { key: "games", label: "Games", category: "Identity" },
    
    // Fantasy scoring
    { key: "fantasy_points_ppr", label: "PPR Points", category: "Fantasy" },
    { key: "fantasy_points", label: "Standard Points", category: "Fantasy" },
    
    // Passing metrics (QB focus)
    { key: "passing_yards", label: "Pass Yards", category: "Passing" },
    { key: "passing_tds", label: "Pass TDs", category: "Passing" },
    { key: "interceptions", label: "Interceptions", category: "Passing" },
    { key: "passing_attempts", label: "Pass Attempts", category: "Passing" },
    { key: "completions", label: "Completions", category: "Passing" },
    { key: "passing_air_yards", label: "Pass Air Yards", category: "Passing" },
    { key: "passing_yards_after_catch", label: "Pass YAC", category: "Passing" },
    { key: "passing_first_downs", label: "Pass 1st Downs", category: "Passing" },
    { key: "passing_epa", label: "Pass EPA", category: "Passing" },
    { key: "dakota", label: "Dakota (Adj Comp%)", category: "Passing" },
    
    // Rushing metrics (RB/QB focus)
    { key: "rushing_yards", label: "Rush Yards", category: "Rushing" },
    { key: "rushing_tds", label: "Rush TDs", category: "Rushing" },
    { key: "rushing_attempts", label: "Rush Attempts", category: "Rushing" },
    { key: "carries", label: "Carries", category: "Rushing" },
    { key: "rushing_first_downs", label: "Rush 1st Downs", category: "Rushing" },
    { key: "rushing_epa", label: "Rush EPA", category: "Rushing" },
    { key: "rushing_yards_after_contact", label: "Rush YAC", category: "Rushing" },
    
    // Receiving metrics (WR/TE/RB focus)
    { key: "receiving_yards", label: "Rec Yards", category: "Receiving" },
    { key: "receiving_tds", label: "Rec TDs", category: "Receiving" },
    { key: "receptions", label: "Receptions", category: "Receiving" },
    { key: "targets", label: "Targets", category: "Receiving" },
    { key: "receiving_air_yards", label: "Rec Air Yards", category: "Receiving" },
    { key: "receiving_yards_after_catch", label: "Rec YAC", category: "Receiving" },
    { key: "receiving_first_downs", label: "Rec 1st Downs", category: "Receiving" },
    { key: "receiving_epa", label: "Rec EPA", category: "Receiving" },
    { key: "target_share", label: "Target Share %", category: "Receiving" },
    
    // Advanced metrics
    { key: "red_zone_touches", label: "RZ Touches", category: "Advanced" },
    { key: "red_zone_targets", label: "RZ Targets", category: "Advanced" },
    { key: "red_zone_carries", label: "RZ Carries", category: "Advanced" },
    { key: "snap_counts", label: "Snap Count", category: "Advanced" },
    { key: "snap_count_pct", label: "Snap Count %", category: "Advanced" },
    { key: "air_yards_share", label: "Air Yards Share %", category: "Advanced" },
    { key: "wopr", label: "WOPR", category: "Advanced" },
    { key: "racr", label: "RACR", category: "Advanced" },
    
    // Calculated metrics
    { key: "catch_rate", label: "Catch Rate %", category: "Calculated" },
    { key: "completion_rate", label: "Completion %", category: "Calculated" },
    { key: "yards_per_carry", label: "Yards/Carry", category: "Calculated" },
    { key: "yards_per_target", label: "Yards/Target", category: "Calculated" },
    { key: "yards_per_reception", label: "Yards/Reception", category: "Calculated" },
    { key: "fantasy_points_per_game", label: "Fantasy Pts/Game", category: "Calculated" },
    { key: "fantasy_points_ppr_per_game", label: "PPR Pts/Game", category: "Calculated" }
  ]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortData = (data: Record<string, unknown>[]) => {
    if (!Array.isArray(data) || data.length === 0) return []
    
    const validData = data.filter(item => item && typeof item === 'object')
    
    return validData.sort((a, b) => {
      const aVal = a?.[sortField]
      const bVal = b?.[sortField]
      
      // Handle string columns
      if (sortField === "player_name" || sortField === "position" || sortField === "team") {
        const aStr = safeString(aVal).toLowerCase()
        const bStr = safeString(bVal).toLowerCase()
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      }
      
      // Handle numeric columns
      const aNum = safeNumber(aVal)
      const bNum = safeNumber(bVal)
      
      if (sortDirection === "desc") {
        if (aNum === 0 && bNum !== 0) return 1
        if (bNum === 0 && aNum !== 0) return -1
        return bNum - aNum
      } else {
        if (aNum === 0 && bNum !== 0) return 1
        if (bNum === 0 && aNum !== 0) return -1
        return aNum - bNum
      }
    })
  }

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

  // Safe auto-load
  useEffect(() => {
    let mounted = true
    
    const autoLoadData = async () => {
      if (!nflData && !loading && mounted) {
        console.log("Auto-loading 2024 NFL data...")
        try {
          await extractNFLData()
        } catch (error) {
          console.error("Failed to auto-load data:", error)
        }
      }
    }
    
    autoLoadData()
    
    return () => {
      mounted = false
    }
  }, [extractNFLData, loading, nflData])

  // Safe data filtering
  const getFilteredWeeklyData = (): Record<string, unknown>[] => {
    if (!nflData?.weekly_stats || !Array.isArray(nflData.weekly_stats)) return []
    
    return nflData.weekly_stats.filter(stat => {
      if (!stat || typeof stat !== 'object') return false
      if (selectedTeam !== "all" && safeString((stat as unknown as Record<string, unknown>).team) !== selectedTeam) return false
      if (selectedPositionFilter !== "ALL" && safeString((stat as unknown as Record<string, unknown>).position) !== selectedPositionFilter) return false
      if (minFantasyPoints && safeNumber((stat as unknown as Record<string, unknown>).fantasy_points_ppr) < parseFloat(minFantasyPoints)) return false
      return true
    }) as unknown as Record<string, unknown>[]
  }

  const getFilteredSeasonData = (): Record<string, unknown>[] => {
    if (!nflData?.aggregated_season_stats || !Array.isArray(nflData.aggregated_season_stats)) return []
    
    return nflData.aggregated_season_stats.filter(stat => {
      if (!stat || typeof stat !== 'object') return false
      if (selectedTeam !== "all" && safeString((stat as unknown as Record<string, unknown>).team) !== selectedTeam) return false
      if (selectedPositionFilter !== "ALL" && safeString((stat as unknown as Record<string, unknown>).position) !== selectedPositionFilter) return false
      if (minFantasyPoints && safeNumber((stat as unknown as Record<string, unknown>).fantasy_points_ppr) < parseFloat(minFantasyPoints)) return false
      return true
    }) as unknown as Record<string, unknown>[]
  }

  // Safe table rendering function
  const renderDataTable = (data: Record<string, unknown>[], showWeek: boolean = false) => {
    const sortedData = sortData(data).slice(0, 100)
    
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                {showWeek && (
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
                )}
                {selectedColumns.map((col, index) => {
                  const field = availableDataFields.find(f => f.key === col)
                  if (!field) return null
                  
                  return (
                    <th key={`header-${col}-${index}`} 
                        className="text-left p-2 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
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
              {sortedData.map((stat, index) => (
                <tr key={generateSafeKey(stat?.player_id, stat?.week, stat?.season, index)} 
                    className="border-b hover:bg-muted/30 transition-colors">
                  {showWeek && (
                    <td className="p-2">
                      Week {safeString(stat?.week)}
                    </td>
                  )}
                  {selectedColumns.map((col, colIndex) => {
                    const field = availableDataFields.find(f => f.key === col)
                    if (!field) return null
                    
                    const value = stat?.[col]
                    const formattedValue = formatValue(value, col)
                    
                    return (
                      <td key={`cell-${col}-${index}-${colIndex}`} className="p-2">
                        {formattedValue}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            NFL Data Manager (Fixed)
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
                  value={selectedYears[0] || ""}
                  onValueChange={(value) => setSelectedYears([value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={`year-${year}`} value={year.toString()}>
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
                    {availablePositions.map(position => (
                      <SelectItem key={`position-${position}`} value={position}>
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
                    {availableWeeks.map(week => (
                      <SelectItem key={`week-${week}`} value={week.toString()}>
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
                    {nflTeams.map(team => (
                      <SelectItem key={`team-${team}`} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
        </CardContent>
      </Card>

      {/* Data Fields Legend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Available Data Fields
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-2"
            >
              {showLegend ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {showLegend ? "Hide" : "Show"} Field Reference
            </Button>
          </div>
        </CardHeader>
        {showLegend && (
          <CardContent>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Complete reference of all data fields available from the NFL data extraction script. 
                Fields are organized by category and include both raw statistics and calculated metrics.
              </p>
              
              {/* Group fields by category */}
              {["Identity", "Fantasy", "Passing", "Rushing", "Receiving", "Advanced", "Calculated"].map(category => {
                const fieldsInCategory = availableDataFields.filter(field => field.category === category)
                if (fieldsInCategory.length === 0) return null
                
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-primary">{category} Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {fieldsInCategory.map(field => (
                        <div key={field.key} className="flex justify-between items-center bg-muted p-2 rounded text-xs">
                          <span className="font-mono text-muted-foreground">{field.key}</span>
                          <span className="font-medium">{field.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-blue-900 mb-2">Metric Definitions</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div><strong>EPA:</strong> Expected Points Added - measures contribution to scoring</div>
                  <div><strong>WOPR:</strong> Weighted Opportunity Rating - combines targets and red zone looks</div>
                  <div><strong>RACR:</strong> Receiver Air Conversion Ratio - air yards to receiving yards ratio</div>
                  <div><strong>Dakota:</strong> Adjusted completion percentage accounting for drops</div>
                  <div><strong>YAC:</strong> Yards After Catch/Contact</div>
                  <div><strong>RZ:</strong> Red Zone (20-yard line to goal line)</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Display */}
      {nflData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>NFL Data Results (Fixed)</CardTitle>
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
                  <div className="text-2xl font-bold">{safeNumber(nflData.metadata?.total_players)}</div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{safeNumber(nflData.metadata?.total_weekly_records)}</div>
                  <p className="text-sm text-muted-foreground">Weekly Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{safeNumber(nflData.metadata?.total_seasonal_records)}</div>
                  <p className="text-sm text-muted-foreground">Seasonal Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{safeNumber(nflData.metadata?.total_aggregated_records)}</div>
                  <p className="text-sm text-muted-foreground">Aggregated Records</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="aggregated" className="space-y-4">
              <TabsList>
                <TabsTrigger value="weekly">Weekly Stats</TabsTrigger>
                <TabsTrigger value="aggregated">Season Totals</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Weekly Statistics</h3>
                  {renderDataTable(getFilteredWeeklyData(), true)}
                  
                  {getFilteredWeeklyData().length === 0 && (
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
                  <h3 className="text-lg font-medium">Season Totals</h3>
                  {renderDataTable(getFilteredSeasonData(), false)}
                  
                  {getFilteredSeasonData().length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No aggregated season stats available. Try selecting &quot;All weeks&quot; to see season totals.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
