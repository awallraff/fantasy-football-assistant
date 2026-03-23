"use client"

import { RefreshCw } from "lucide-react"
import { LeagueCard } from "@/components/dashboard/league-card"
import { YearSelector } from "@/components/dashboard/year-selector"
import type { SleeperLeague, SleeperUser } from "@/lib/sleeper-api"

export interface DashboardLeagueSelectionViewProps {
  user: SleeperUser
  selectedYear: string
  availableYears: string[]
  loadingYears: boolean
  loading: boolean
  currentYearLeagues: SleeperLeague[]
  onYearChange: (year: string) => Promise<void>
  onViewAnalytics: (league: SleeperLeague) => void | Promise<void>
  onRemoveLeague: (leagueId: string, leagueName?: string) => void | Promise<void>
}

/**
 * Dashboard when the user has leagues but has not opened a league detail view.
 */
export function DashboardLeagueSelectionView({
  user,
  selectedYear,
  availableYears,
  loadingYears,
  loading,
  currentYearLeagues,
  onYearChange,
  onViewAnalytics,
  onRemoveLeague,
}: DashboardLeagueSelectionViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg pb-compact-xl pt-compact-xl md:px-compact-xl safe-area-inset-top safe-area-inset-bottom">
        <div className="mb-compact-lg text-center">
          <h1 className="mb-compact-xs text-ios-title-1 font-bold text-foreground">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-ios-body text-text-secondary">Select a league to view detailed analytics and insights</p>

          <YearSelector selectedYear={selectedYear} availableYears={availableYears} onYearChange={onYearChange} />
        </div>

        {loadingYears && (
          <div className="py-compact-xl text-center">
            <RefreshCw className="mx-auto mb-compact-xs h-6 w-6 animate-spin text-primary" />
            <p className="text-ios-body text-text-secondary">Loading leagues for {selectedYear}...</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-compact-md md:grid-cols-2 md:gap-compact-xl lg:grid-cols-3">
          {currentYearLeagues.map((league) => (
            <LeagueCard
              key={league.league_id}
              league={league}
              loading={loading}
              onViewAnalytics={onViewAnalytics}
              onRemoveLeague={onRemoveLeague}
            />
          ))}
        </div>

        {!loadingYears && currentYearLeagues.length === 0 && (
          <div className="py-compact-xl text-center">
            <p className="mb-compact-md text-ios-title-3 text-text-secondary">
              No leagues found for {selectedYear} season
            </p>
            {availableYears.length > 1 && (
              <p className="text-ios-body text-text-tertiary">Try selecting a different year above</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
