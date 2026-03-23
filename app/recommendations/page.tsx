"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import { useSleeperLocalLeagues } from "@/hooks/use-sleeper-local-leagues"
import { sleeperAPI } from "@/lib/sleeper-api"
import { ErrorDisplay, categorizeError } from "@/components/ui/error-display"
import { RecommendationsPageMain } from "@/components/recommendations/recommendations-page-main"
import {
  SleeperToolsHydrationSkeleton,
  SleeperToolsLoadError,
  SleeperNoLeaguesForSeasonCard,
} from "@/components/sleeper/sleeper-tools-page-states"

export default function RecommendationsPage() {
  const [selectedSeason, setSelectedSeason] = useState("2025")
  const [apiError, setApiError] = useState<{ message: string; error: unknown } | null>(null)
  const { setItem } = useSafeLocalStorage()
  const { user, leagues, setLeagues, selectedLeague, setSelectedLeague, loadError, isClient } =
    useSleeperLocalLeagues()

  const refreshLeaguesForSeason = useCallback(
    async (season: string) => {
      if (!user) return
      setApiError(null)
      try {
        const seasonLeagues = await sleeperAPI.getUserLeagues(user.user_id, "nfl", season)
        setLeagues(seasonLeagues)
        setSelectedLeague(seasonLeagues.length > 0 ? seasonLeagues[0] : null)
        setItem("sleeper_leagues", JSON.stringify(seasonLeagues))
      } catch (error) {
        console.error("Error fetching leagues for season:", error)
        setApiError({
          message: error instanceof Error ? error.message : "Failed to fetch leagues for selected season",
          error,
        })
      }
    },
    [user, setLeagues, setSelectedLeague, setItem]
  )

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season)
    void refreshLeaguesForSeason(season)
  }

  if (!isClient) {
    return <SleeperToolsHydrationSkeleton />
  }

  if (loadError) {
    return (
      <SleeperToolsLoadError
        pageTitle="AI Recommendations"
        message={loadError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
          <ErrorDisplay
            type={categorizeError(apiError.error)}
            title="Failed to fetch league data"
            message={apiError.message}
            showRetry={true}
            onRetry={() => refreshLeaguesForSeason(selectedSeason)}
            actions={
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <Link href="/">Return home</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (!user || leagues.length === 0) {
    return (
      <SleeperNoLeaguesForSeasonCard selectedSeason={selectedSeason} onSeasonChange={handleSeasonChange} />
    )
  }

  return (
    <RecommendationsPageMain
      user={user}
      leagues={leagues}
      selectedLeague={selectedLeague}
      selectedSeason={selectedSeason}
      onLeagueSelect={setSelectedLeague}
      onSeasonChange={handleSeasonChange}
    />
  )
}
