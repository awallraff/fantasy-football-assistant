"use client"

import { useSleeperLocalLeagues } from "@/hooks/use-sleeper-local-leagues"
import { TradesPageMain } from "@/components/trades/trades-page-main"
import {
  SleeperToolsHydrationSkeleton,
  SleeperToolsLoadError,
  SleeperNoLeaguesConnectCard,
} from "@/components/sleeper/sleeper-tools-page-states"

export default function TradesPage() {
  const { user, leagues, setSelectedLeague, selectedLeague, loadError, isClient } = useSleeperLocalLeagues()

  if (!isClient) {
    return <SleeperToolsHydrationSkeleton />
  }

  if (loadError) {
    return (
      <SleeperToolsLoadError
        pageTitle="Trade Analysis"
        message={loadError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!user || leagues.length === 0) {
    return <SleeperNoLeaguesConnectCard />
  }

  return (
    <TradesPageMain
      user={user}
      leagues={leagues}
      selectedLeague={selectedLeague}
      onLeagueSelect={setSelectedLeague}
    />
  )
}
