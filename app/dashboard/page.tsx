"use client"

import { useEffect, useCallback, useRef } from "react"
import { DashboardLoadingSkeleton } from "@/components/dashboard/loading-skeleton"
import { NoLeaguesConnected } from "@/components/no-leagues-connected"
import { DashboardSelectedLeagueView } from "@/components/dashboard/dashboard-selected-league-view"
import { DashboardLeagueSelectionView } from "@/components/dashboard/dashboard-league-selection-view"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useLeagueSelection } from "@/hooks/use-league-selection"
import { useLoadingStates } from "@/hooks/use-loading-states"
import { useDebugInfo } from "@/hooks/use-debug-info"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { useConfirmation } from "@/hooks/use-confirmation"
import { SleeperLeague } from "@/lib/sleeper-api"

export default function DashboardPage() {
  const { isClient } = useSafeLocalStorage()
  const debugInfoInitialized = useRef(false)

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

  const { loading, loadingYears, retrying, withLoading, withLoadingYears, withRetrying } = useLoadingStates()

  const { debugInfo, generateInitialDebugInfo, generateRetryDebugInfo, setDebugInfo } = useDebugInfo()

  const { confirm } = useConfirmation()

  useEffect(() => {
    if (!isClient || debugInfoInitialized.current) return
    if (!user && leagues.length === 0) return
    generateInitialDebugInfo(user, leagues)
    debugInfoInitialized.current = true
  }, [isClient, user, leagues, generateInitialDebugInfo])

  const handleYearChange = useCallback(
    async (year: string) => {
      setSelectedYear(year)
      if (!leaguesByYear[year]) {
        await withLoadingYears(() => loadLeaguesForYear(year))
      }
    },
    [leaguesByYear, loadLeaguesForYear, setSelectedYear, withLoadingYears]
  )

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

  const handleLoadLeagueDetails = useCallback(
    async (league: SleeperLeague) => {
      await withLoading(() => loadLeagueDetails(league))
    },
    [withLoading, loadLeagueDetails]
  )

  const handleRemoveLeague = useCallback(
    async (leagueId: string, leagueName?: string) => {
      const league = leagues.find((l) => l.league_id === leagueId)
      const displayName = leagueName || league?.name || "this league"

      const confirmed = await confirm({
        title: "Remove League",
        description: `Are you sure you want to remove "${displayName}"? This action cannot be undone.`,
        confirmLabel: "Remove",
        cancelLabel: "Cancel",
        variant: "destructive",
      })

      if (!confirmed) return

      if (selectedLeague?.league_id === leagueId) {
        handleBackToLeagues()
      }
      removeLeague(leagueId, leagueName)
    },
    [selectedLeague, handleBackToLeagues, removeLeague, leagues, confirm]
  )

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
      <DashboardSelectedLeagueView
        selectedLeague={selectedLeague}
        selectedYear={selectedYear}
        availableYears={availableYears}
        currentYearLeagues={currentYearLeagues}
        loading={loading}
        currentUserId={user?.user_id}
        rosters={rosters}
        leagueUsers={leagueUsers}
        sortedRosters={sortedRosters}
        onBackToLeagues={handleBackToLeagues}
        onYearChange={handleYearChange}
        onLeagueChange={handleLeagueChange}
        onRefreshLeague={() => handleLoadLeagueDetails(selectedLeague)}
      />
    )
  }

  return (
    <DashboardLeagueSelectionView
      user={user}
      selectedYear={selectedYear}
      availableYears={availableYears}
      loadingYears={loadingYears}
      loading={loading}
      currentYearLeagues={currentYearLeagues}
      onYearChange={handleYearChange}
      onViewAnalytics={handleLoadLeagueDetails}
      onRemoveLeague={handleRemoveLeague}
    />
  )
}
