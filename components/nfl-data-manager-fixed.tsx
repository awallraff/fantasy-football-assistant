"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Database, RefreshCw, CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronRight } from "lucide-react"
import { NFLDataControls } from "./nfl-data/NFLDataControls"
import { NFLDataTable } from "./nfl-data/NFLDataTable"
import { useNFLDataFetch } from "@/hooks/use-nfl-data-fetch"
import { useNFLDataSort } from "@/hooks/use-nfl-data-sort"
import { useNFLDataFilter } from "@/hooks/use-nfl-data-filter"
import { useNFLDataExport } from "@/hooks/use-nfl-data-export"
import { safeNumber, formatValue, generateSafeKey } from "@/lib/nfl-data-utils"

export function NFLDataManagerFixed() {
  // Default to 2024 (most recent season with available data)
  const [selectedYears, setSelectedYears] = useState<string[]>(["2024"])
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["QB", "RB", "WR", "TE"])
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>("ALL")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [minFantasyPoints, setMinFantasyPoints] = useState<string>("")
  const [selectedColumns] = useState<string[]>([
    "player_name", "position", "team", "fantasy_points_ppr", "targets", "receptions",
    "receiving_yards", "receiving_tds", "rushing_attempts", "rushing_yards", "rushing_tds",
    "passing_yards", "passing_tds", "interceptions"
  ])
  const [showLegend, setShowLegend] = useState(false)

  // Custom hooks for data operations
  const { data: nflData, loading, error, testResult, testConnection, extractData } = useNFLDataFetch({
    selectedYears,
    selectedPositions,
    selectedWeek,
    autoLoad: true,
  })

  const { sortField, sortDirection, handleSort, sortData } = useNFLDataSort("fantasy_points_ppr")

  const { filterWeeklyData, filterSeasonData } = useNFLDataFilter({
    selectedTeam,
    selectedPositionFilter,
    minFantasyPoints,
  })

  const { exportData: handleExportData } = useNFLDataExport()

  // Constants with safe defaults
  // Most recent season with available data (2024 as of now)
  const latestAvailableYear = 2024
  const availableYears = Array.from({ length: 5 }, (_, i) => latestAvailableYear - i)
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

          {/* Data Availability Warning */}
          {selectedYears.length > 0 && parseInt(selectedYears[0]) > latestAvailableYear && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Data Not Available</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {selectedYears[0]} season data is not yet available. Most recent data available: {latestAvailableYear}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              {error.includes("404") && (
                <p className="text-sm text-destructive/80 mt-1">
                  Try selecting {latestAvailableYear} or an earlier season with available data.
                </p>
              )}
            </div>
          )}

          {/* Data Extraction Controls */}
          <NFLDataControls
            selectedYears={selectedYears}
            onYearsChange={setSelectedYears}
            availableYears={availableYears}
            latestAvailableYear={latestAvailableYear}
            selectedPositionFilter={selectedPositionFilter}
            onPositionFilterChange={setSelectedPositionFilter}
            selectedPositions={selectedPositions}
            onPositionsChange={setSelectedPositions}
            availablePositions={availablePositions}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            availableWeeks={availableWeeks}
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
            nflTeams={nflTeams}
            minFantasyPoints={minFantasyPoints}
            onMinFantasyPointsChange={setMinFantasyPoints}
            loading={loading}
            onExtractData={extractData}
          />
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
              <Button onClick={() => handleExportData(nflData, selectedYears)} variant="outline" size="sm">
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
                  <NFLDataTable
                    data={sortData(filterWeeklyData(nflData))}
                    showWeek={true}
                    selectedColumns={selectedColumns}
                    availableDataFields={availableDataFields}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    formatValue={formatValue}
                    generateKey={generateSafeKey}
                  />
                </div>
              </TabsContent>

              <TabsContent value="aggregated">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Season Totals</h3>
                  <NFLDataTable
                    data={sortData(filterSeasonData(nflData))}
                    showWeek={false}
                    selectedColumns={selectedColumns}
                    availableDataFields={availableDataFields}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    formatValue={formatValue}
                    generateKey={generateSafeKey}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
