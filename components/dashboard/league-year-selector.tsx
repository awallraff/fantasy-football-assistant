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
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-20 min-h-[44px] flex-shrink-0">
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
        <SelectTrigger className="flex-1 sm:w-64 min-h-[44px]">
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
