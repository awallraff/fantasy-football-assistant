"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface LeagueYearSelectorProps {
  selectedYear: string
  selectedLeagueId: string
  availableYears: string[]
  currentYearLeagues: SleeperLeague[]
  onYearChange: (year: string) => void
  onLeagueChange: (leagueId: string) => void
}

export function LeagueYearSelector({
  selectedYear,
  selectedLeagueId,
  availableYears,
  currentYearLeagues,
  onYearChange,
  onLeagueChange,
}: LeagueYearSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map(year => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedLeagueId} onValueChange={onLeagueChange}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currentYearLeagues.map(league => (
            <SelectItem key={league.league_id} value={league.league_id}>
              {league.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
