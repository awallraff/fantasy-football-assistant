"use client"

import { useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RefreshCw, BarChart3, Users, Trophy, Activity } from "lucide-react"
import { EnhancedTeamRoster } from "@/components/enhanced-team-roster"
import { DashboardLoadingSkeleton } from "@/components/dashboard/loading-skeleton"
import { NoLeaguesConnected } from "@/components/no-leagues-connected"
import { LeagueCard } from "@/components/dashboard/league-card"
import { LeagueHeader } from "@/components/dashboard/league-header"
import { YearSelector } from "@/components/dashboard/year-selector"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useLeagueSelection } from "@/hooks/use-league-selection"
import { useLoadingStates } from "@/hooks/use-loading-states"
import { useDebugInfo } from "@/hooks/use-debug-info"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { SleeperLeague } from "@/lib/sleeper-api"

// Lazy-load heavy tab components to reduce initial bundle size
const LeagueOverview = dynamic(() => import("@/components/league-overview").then(mod => ({ default: mod.LeagueOverview })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const StandingsTable = dynamic(() => import("@/components/standings-table").then(mod => ({ default: mod.StandingsTable })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const RecentActivity = dynamic(() => import("@/components/recent-activity").then(mod => ({ default: mod.RecentActivity })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

export default function DashboardPage() {
  const { isClient } = useSafeLocalStorage()
  
  // Dashboard data management
  const {
    user,
    leagues,
    leaguesByYear,
    selectedYear,
    setSelectedYear,
    loadLeaguesForYear,
    removeLeague,
    retryConnection,
    clearAndRestart,
    availableYears,
    currentYearLeagues,
  } = useDashboardData()

  // League selection management
  const {
    selectedLeague,
    rosters,
    leagueUsers,
    loadLeagueDetails,
    handleBackToLeagues,
    handleLeagueChange,
    sortedRosters,
  } = useLeagueSelection({
    leaguesByYear,
    selectedYear,
    currentUser: user,
  })

  // Loading states management
  const { 
    loading, 
    loadingYears, 
    retrying, 
    withLoading, 
    withLoadingYears, 
    withRetrying 
  } = useLoadingStates()

  // Debug information management
  const { 
    debugInfo, 
    generateInitialDebugInfo, 
    generateRetryDebugInfo,
    setDebugInfo 
  } = useDebugInfo()

  // Initialize debug info when user and leagues data change
  useEffect(() => {
    if (isClient && (user || leagues.length > 0)) {
      generateInitialDebugInfo(user, leagues)
    }
  }, [isClient, user, leagues, generateInitialDebugInfo])

  // Wrapped year change handler
  const handleYearChange = useCallback(async (year: string) => {
    setSelectedYear(year)
    
    // Load leagues for this year if not already loaded
    if (!leaguesByYear[year]) {
      await withLoadingYears(() => loadLeaguesForYear(year))
    }
  }, [leaguesByYear, loadLeaguesForYear, setSelectedYear, withLoadingYears])

  // Wrapped retry connection handler
  const handleRetryConnection = useCallback(async () => {
    try {
      await withRetrying(async () => {
        await retryConnection()
        const debugInfo = await generateRetryDebugInfo()
        setDebugInfo(debugInfo)
      })
    } catch {
      const errorDebugInfo = await generateRetryDebugInfo()
      setDebugInfo(errorDebugInfo)
    }
  }, [withRetrying, retryConnection, generateRetryDebugInfo, setDebugInfo])

  // Wrapped league details loading
  const handleLoadLeagueDetails = useCallback(async (league: SleeperLeague) => {
    await withLoading(() => loadLeagueDetails(league))
  }, [withLoading, loadLeagueDetails])

  // Enhanced remove league with current league check
  const handleRemoveLeague = useCallback((leagueId: string, leagueName?: string) => {
    // If the removed league was the currently selected one, go back to leagues
    if (selectedLeague?.league_id === leagueId) {
      handleBackToLeagues()
    }
    removeLeague(leagueId, leagueName)
  }, [selectedLeague, handleBackToLeagues, removeLeague])


  // Show loading state during hydration
  if (!isClient) {
    return <DashboardLoadingSkeleton />
  }

  if (!user || leagues.length === 0) {
    return (
      <NoLeaguesConnected
        hasUser={!!user}
        debugInfo={debugInfo}
        retrying={retrying}
        onRetry={handleRetryConnection}
        onClearAndRestart={clearAndRestart}
      />
    )
  }

  if (selectedLeague) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-background dark:via-background-elevated/30 dark:to-background">
        <div className="container mx-auto px-compact-lg md:px-compact-xl pt-compact-xl pb-compact-xl safe-area-inset-top safe-area-inset-bottom">
          <LeagueHeader
            selectedLeague={selectedLeague}
            selectedYear={selectedYear}
            availableYears={availableYears}
            currentYearLeagues={currentYearLeagues}
            loading={loading}
            onBackToLeagues={handleBackToLeagues}
            onYearChange={handleYearChange}
            onLeagueChange={handleLeagueChange}
            onRefresh={() => handleLoadLeagueDetails(selectedLeague)}
          />

          <Tabs defaultValue="overview" className="space-y-0">
            <TabsList className="grid w-full grid-cols-4 min-h-[44px] bg-background-elevated shadow-md rounded-lg mb-8">
              <TabsTrigger value="overview" className="min-h-[44px] gap-2" title="Overview">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="min-h-[44px] gap-2" title="Teams">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Teams</span>
              </TabsTrigger>
              <TabsTrigger value="standings" className="min-h-[44px] gap-2" title="Standings">
                <Trophy className="h-4 w-4" />
                <span className="hidden md:inline">Standings</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="min-h-[44px] gap-2" title="Activity">
                <Activity className="h-4 w-4" />
                <span className="hidden md:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <LeagueOverview league={selectedLeague} rosters={rosters} users={leagueUsers} />
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              <div className="grid gap-compact-md md:gap-compact-xl">
                {/* Debug info - remove after fixing */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 p-compact-md rounded-lg text-xs shadow-sm">
                    <div>Rosters: {rosters.length}</div>
                    <div>Sorted Rosters: {sortedRosters.length}</div>
                    <div>League Users: {leagueUsers.length}</div>
                    <div>User IDs: {leagueUsers.map(u => u.user_id).join(', ')}</div>
                    <div>Roster Owner IDs: {rosters.map(r => r.owner_id).join(', ')}</div>
                  </div>
                )}

                <div className="space-y-compact-xl">
                  {sortedRosters.length === 0 ? (
                    <Card className="bg-background-elevated shadow-md rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-ios-title-3">No Teams Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-text-secondary text-ios-body">
                          {rosters.length === 0
                            ? "No rosters loaded for this league. Try refreshing the page."
                            : leagueUsers.length === 0
                            ? "League user data is missing. Try refreshing the page."
                            : "Unable to match rosters with league users. Contact support if this persists."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    sortedRosters.map((roster) => {
                      // sortedRosters is now pre-filtered to only include rosters with matching owners
                      const owner = leagueUsers.find((u) => u.user_id === roster.owner_id)

                      // This should never happen now, but keep as defensive check
                      if (!owner) {
                        console.error(`CRITICAL: No owner found for roster ${roster.roster_id} despite filtering`)
                        return null
                      }

                      return (
                        <EnhancedTeamRoster
                          key={roster.roster_id}
                          roster={roster}
                          user={owner}
                          isCurrentUser={owner.user_id === user?.user_id}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="standings" className="mt-0">
              <StandingsTable rosters={rosters} users={leagueUsers} league={selectedLeague} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <RecentActivity leagueId={selectedLeague.league_id} users={leagueUsers} rosters={rosters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-background dark:via-background-elevated/30 dark:to-background">
      <div className="container mx-auto px-compact-lg md:px-compact-xl pt-compact-xl pb-compact-xl safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="text-center mb-compact-lg">
          <h1 className="text-ios-title-1 font-bold text-foreground mb-compact-xs">
            Welcome back, {user.display_name || user.username}!
          </h1>
          <p className="text-ios-body text-text-secondary">Select a league to view detailed analytics and insights</p>

          <YearSelector
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={handleYearChange}
          />
        </div>

        {/* Loading State */}
        {loadingYears && (
          <div className="text-center py-compact-xl">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-compact-xs text-primary" />
            <p className="text-text-secondary text-ios-body">Loading leagues for {selectedYear}...</p>
          </div>
        )}

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-compact-md md:gap-compact-xl">
          {currentYearLeagues.map((league) => (
            <LeagueCard
              key={league.league_id}
              league={league}
              loading={loading}
              onViewAnalytics={handleLoadLeagueDetails}
              onRemoveLeague={handleRemoveLeague}
            />
          ))}
        </div>
        
        {/* No Leagues Message */}
        {!loadingYears && currentYearLeagues.length === 0 && (
          <div className="text-center py-compact-xl">
            <p className="text-text-secondary text-ios-title-3 mb-compact-md">
              No leagues found for {selectedYear} season
            </p>
            {availableYears.length > 1 && (
              <p className="text-ios-body text-text-tertiary">
                Try selecting a different year above
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
