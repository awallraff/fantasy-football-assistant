"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"

export interface NFLDataControlsProps {
  // Year controls
  selectedYears: string[]
  onYearsChange: (years: string[]) => void
  availableYears: number[]
  latestAvailableYear: number

  // Position controls
  selectedPositionFilter: string
  onPositionFilterChange: (position: string) => void
  selectedPositions: string[]
  onPositionsChange: (positions: string[]) => void
  availablePositions: string[]

  // Week controls
  selectedWeek: string
  onWeekChange: (week: string) => void
  availableWeeks: number[]

  // Team controls
  selectedTeam: string
  onTeamChange: (team: string) => void
  nflTeams: string[]

  // Filter controls
  minFantasyPoints: string
  onMinFantasyPointsChange: (value: string) => void

  // Actions
  loading: boolean
  onExtractData: () => void
}

export function NFLDataControls({
  selectedYears,
  onYearsChange,
  availableYears,
  selectedPositionFilter,
  onPositionFilterChange,
  onPositionsChange,
  availablePositions,
  selectedWeek,
  onWeekChange,
  availableWeeks,
  selectedTeam,
  onTeamChange,
  nflTeams,
  minFantasyPoints,
  onMinFantasyPointsChange,
  loading,
  onExtractData,
}: NFLDataControlsProps) {

  const handlePositionChange = (value: string) => {
    onPositionFilterChange(value)
    if (value === "ALL") {
      onPositionsChange(["QB", "RB", "WR", "TE"])
    } else {
      onPositionsChange([value])
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Year Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Years</label>
          <Select
            value={selectedYears[0] || ""}
            onValueChange={(value) => onYearsChange([value])}
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

        {/* Position Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Positions</label>
          <Select
            value={selectedPositionFilter}
            onValueChange={handlePositionChange}
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

        {/* Week Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Week (Optional)</label>
          <Select value={selectedWeek} onValueChange={onWeekChange}>
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

        {/* Team Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Team (Optional)</label>
          <Select value={selectedTeam} onValueChange={onTeamChange}>
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

      {/* Min Fantasy Points and Extract Button */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Min Fantasy Points:</label>
          <Input
            type="number"
            placeholder="0"
            value={minFantasyPoints}
            onChange={(e) => onMinFantasyPointsChange(e.target.value)}
            className="w-24"
          />
        </div>

        <Button onClick={onExtractData} disabled={loading}>
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Extract Data
        </Button>
      </div>
    </div>
  )
}
