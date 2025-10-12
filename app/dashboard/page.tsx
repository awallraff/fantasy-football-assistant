"use client"

import { useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { LeagueOverview } from "@/components/league-overview"
import { EnhancedTeamRoster } from "@/components/enhanced-team-roster"
import { StandingsTable } from "@/components/standings-table"
import { RecentActivity } from "@/components/recent-activity"
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 min-h-[44px]">
              <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
              <TabsTrigger value="teams" className="min-h-[44px]">Teams</TabsTrigger>
              <TabsTrigger value="standings" className="min-h-[44px]">Standings</TabsTrigger>
              <TabsTrigger value="activity" className="min-h-[44px]">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <LeagueOverview league={selectedLeague} rosters={rosters} users={leagueUsers} />
            </TabsContent>

            <TabsContent value="teams">
              <div className="grid gap-6">
                {/* Debug info - remove after fixing */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded text-xs">
                    <div>Rosters: {rosters.length}</div>
                    <div>Sorted Rosters: {sortedRosters.length}</div>
                    <div>League Users: {leagueUsers.length}</div>
                    <div>User IDs: {leagueUsers.map(u => u.user_id).join(', ')}</div>
                    <div>Roster Owner IDs: {rosters.map(r => r.owner_id).join(', ')}</div>
                  </div>
                )}

                <div className="space-y-4">
                  {sortedRosters.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Teams Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
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
                      const owner = leagueUsers.find((u) => u.user_id === roster.owner_id)

                      // Log when owner is not found
                      if (!owner) {
                        console.warn(`No owner found for roster ${roster.roster_id} with owner_id ${roster.owner_id}`)
                        console.warn('Available users:', leagueUsers.map(u => ({ id: u.user_id, name: u.display_name || u.username })))
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

            <TabsContent value="standings">
              <StandingsTable rosters={rosters} users={leagueUsers} league={selectedLeague} />
            </TabsContent>

            <TabsContent value="activity">
              <RecentActivity leagueId={selectedLeague.league_id} users={leagueUsers} rosters={rosters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-ios-title-1 font-bold text-foreground mb-2">
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
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading leagues for {selectedYear}...</p>
          </div>
        )}

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No leagues found for {selectedYear} season
            </p>
            {availableYears.length > 1 && (
              <p className="text-sm text-muted-foreground">
                Try selecting a different year above
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
