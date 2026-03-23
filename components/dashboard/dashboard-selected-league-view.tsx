"use client"

import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, BarChart3, Trophy, Users } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { LeagueHeader } from "@/components/dashboard/league-header"
import { DashboardTeamsTab } from "@/components/dashboard/dashboard-teams-tab"
import type { SleeperLeague, SleeperRoster, SleeperUser } from "@/lib/sleeper-api"

const LeagueOverview = dynamic(
  () => import("@/components/league-overview").then((mod) => ({ default: mod.LeagueOverview })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const StandingsTable = dynamic(
  () => import("@/components/standings-table").then((mod) => ({ default: mod.StandingsTable })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)
const RecentActivity = dynamic(
  () => import("@/components/recent-activity").then((mod) => ({ default: mod.RecentActivity })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    ),
  }
)

export interface DashboardSelectedLeagueViewProps {
  selectedLeague: SleeperLeague
  selectedYear: string
  availableYears: string[]
  currentYearLeagues: SleeperLeague[]
  loading: boolean
  currentUserId: string | null | undefined
  rosters: SleeperRoster[]
  leagueUsers: SleeperUser[]
  sortedRosters: SleeperRoster[]
  onBackToLeagues: () => void
  onYearChange: (year: string) => Promise<void>
  onLeagueChange: (leagueId: string) => void
  onRefreshLeague: () => void | Promise<void>
}

/**
 * Dashboard shell when a league is selected: header + tabbed league content.
 */
export function DashboardSelectedLeagueView({
  selectedLeague,
  selectedYear,
  availableYears,
  currentYearLeagues,
  loading,
  currentUserId,
  rosters,
  leagueUsers,
  sortedRosters,
  onBackToLeagues,
  onYearChange,
  onLeagueChange,
  onRefreshLeague,
}: DashboardSelectedLeagueViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-compact-lg pb-compact-xl pt-compact-xl md:px-compact-xl safe-area-inset-top safe-area-inset-bottom">
        <LeagueHeader
          selectedLeague={selectedLeague}
          selectedYear={selectedYear}
          availableYears={availableYears}
          currentYearLeagues={currentYearLeagues}
          loading={loading}
          onBackToLeagues={onBackToLeagues}
          onYearChange={onYearChange}
          onLeagueChange={onLeagueChange}
          onRefresh={() => void onRefreshLeague()}
        />

        <Tabs defaultValue="overview" className="space-y-0">
          <TabsList className="mb-8 grid w-full min-h-[44px] grid-cols-4 rounded-lg bg-background-elevated shadow-md">
            <TabsTrigger value="overview" className="min-h-[44px] gap-2" title="Overview" aria-label="View league overview">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="min-h-[44px] gap-2" title="Teams" aria-label="View all teams">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="min-h-[44px] gap-2" title="Standings" aria-label="View league standings">
              <Trophy className="h-4 w-4" />
              <span className="hidden md:inline">Standings</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="min-h-[44px] gap-2" title="Activity" aria-label="View recent activity">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ErrorBoundary level="component">
              <LeagueOverview league={selectedLeague} rosters={rosters} users={leagueUsers} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="teams" className="mt-0">
            <ErrorBoundary level="component">
              <DashboardTeamsTab
                rosters={rosters}
                leagueUsers={leagueUsers}
                sortedRosters={sortedRosters}
                currentUserId={currentUserId}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="standings" className="mt-0">
            <ErrorBoundary level="component">
              <StandingsTable rosters={rosters} users={leagueUsers} league={selectedLeague} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <ErrorBoundary level="component">
              <RecentActivity leagueId={selectedLeague.league_id} users={leagueUsers} rosters={rosters} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
