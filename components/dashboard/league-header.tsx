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
    <div className="flex flex-col gap-compact-md mb-compact-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-compact-sm md:gap-compact-md">
        <Button variant="outline" onClick={onBackToLeagues} className="min-h-[44px] flex-shrink-0 shadow-sm bg-background-elevated">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline text-ios-body">Back to Leagues</span>
          <span className="sm:hidden text-ios-body">Back</span>
        </Button>
        <div className="min-w-0">
          <h1 className="text-ios-title-2 md:text-ios-title-1 font-bold text-foreground truncate">{selectedLeague.name}</h1>
          <p className="text-ios-footnote md:text-ios-subheadline text-text-secondary">
            {selectedLeague.total_rosters} teams • {selectedLeague.season} season
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-compact-sm sm:flex-row sm:items-center">
        <LeagueYearSelector
          selectedYear={selectedYear}
          selectedLeagueId={selectedLeague.league_id}
          availableYears={availableYears}
          currentYearLeagues={currentYearLeagues}
          onYearChange={onYearChange}
          onLeagueChange={onLeagueChange}
        />

        <div className="hidden sm:block h-6 w-px bg-separator"></div>

        <Button variant="outline" onClick={onRefresh} disabled={loading} className="min-h-[44px] w-full sm:w-auto shadow-sm bg-background-elevated">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          <span className="text-ios-body">Refresh</span>
        </Button>
      </div>
    </div>
  )
}
