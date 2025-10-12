"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { LeagueYearSelector } from "./league-year-selector"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface LeagueHeaderProps {
  selectedLeague: SleeperLeague
  selectedYear: string
  availableYears: string[]
  currentYearLeagues: SleeperLeague[]
  loading: boolean
  onBackToLeagues: () => void
  onYearChange: (year: string) => void
  onLeagueChange: (leagueId: string) => void
  onRefresh: () => void
}

export function LeagueHeader({
  selectedLeague,
  selectedYear,
  availableYears,
  currentYearLeagues,
  loading,
  onBackToLeagues,
  onYearChange,
  onLeagueChange,
  onRefresh,
}: LeagueHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToLeagues} className="min-h-[44px]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leagues
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{selectedLeague.name}</h1>
          <p className="text-muted-foreground">
            {selectedLeague.total_rosters} teams • {selectedLeague.season} season
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LeagueYearSelector
          selectedYear={selectedYear}
          selectedLeagueId={selectedLeague.league_id}
          availableYears={availableYears}
          currentYearLeagues={currentYearLeagues}
          onYearChange={onYearChange}
          onLeagueChange={onLeagueChange}
        />

        <div className="h-6 w-px bg-border"></div>

        <Button variant="outline" onClick={onRefresh} disabled={loading} className="min-h-[44px]">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}
