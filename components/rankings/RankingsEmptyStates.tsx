"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import type { RankingSystem } from "@/lib/rankings-types"

/**
 * Props interface for RankingsEmptyStates component
 */
export interface RankingsEmptyStatesProps {
  hasNoDataSources: boolean
  isLoading: boolean
  selectedSource: "all" | "user" | "ai"
  systemsCount: number
  onLoadDemoData: () => void
}

/**
 * RankingsEmptyStates Component
 *
 * Handles all empty and error state UI for the rankings page:
 * - No data sources connected warning
 * - External APIs unavailable message with demo data option
 * - Contextual help messages based on selected source
 *
 * @component
 * @example
 * ```tsx
 * <RankingsEmptyStates
 *   hasNoDataSources={userRankingSystems.length === 0}
 *   isLoading={isLoading}
 *   selectedSource={selectedSource}
 *   systemsCount={getAllSystems().length}
 *   onLoadDemoData={handleLoadDemoData}
 * />
 * ```
 */
export const RankingsEmptyStates = React.memo<RankingsEmptyStatesProps>(
  ({ hasNoDataSources, isLoading, selectedSource, systemsCount, onLoadDemoData }) => {
    // No data sources at all
    if (hasNoDataSources) {
      return (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="h-5 w-5 text-destructive mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-medium text-foreground">
                  No Data Sources Connected
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Import your own rankings to see player data. This application uses
                  real data from external sources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Has data sources but none available for current selection
    if (!hasNoDataSources && systemsCount === 0 && !isLoading) {
      return (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="h-5 w-5 text-yellow-600 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-medium text-foreground">
                  External APIs Not Available
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  External APIs are currently unavailable. Please:
                </p>
                <ul className="text-sm text-muted-foreground mb-3 list-disc list-inside space-y-1">
                  <li>Enter it in the &quot;API Keys&quot; tab below</li>
                  <li>Or use the demo data to test functionality</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoadDemoData}
                  aria-label="Load demo data to test functionality"
                >
                  Load Demo Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }
)

RankingsEmptyStates.displayName = "RankingsEmptyStates"

/**
 * Demo ranking system data generator
 * Creates sample data to demonstrate functionality
 */
export const createDemoRankingSystem = (): RankingSystem => {
  return {
    id: "demo-rankings",
    name: "Demo Rankings (Sample Data)",
    description: "Sample fantasy football rankings to demonstrate functionality",
    source: "Demo",
    season: "2025",
    scoringFormat: "ppr",
    positions: ["QB", "RB", "WR", "TE"],
    rankings: [
      {
        rank: 1,
        playerId: "demo-1",
        playerName: "Josh Allen",
        position: "QB",
        team: "BUF",
        projectedPoints: 382.5,
      },
      {
        rank: 2,
        playerId: "demo-2",
        playerName: "Christian McCaffrey",
        position: "RB",
        team: "SF",
        projectedPoints: 345.2,
      },
      {
        rank: 3,
        playerId: "demo-3",
        playerName: "Justin Jefferson",
        position: "WR",
        team: "MIN",
        projectedPoints: 298.7,
      },
      {
        rank: 4,
        playerId: "demo-4",
        playerName: "Travis Kelce",
        position: "TE",
        team: "KC",
        projectedPoints: 267.3,
      },
      {
        rank: 5,
        playerId: "demo-5",
        playerName: "Tyreek Hill",
        position: "WR",
        team: "MIA",
        projectedPoints: 289.1,
      },
      {
        rank: 6,
        playerId: "demo-6",
        playerName: "Saquon Barkley",
        position: "RB",
        team: "PHI",
        projectedPoints: 312.8,
      },
      {
        rank: 7,
        playerId: "demo-7",
        playerName: "CeeDee Lamb",
        position: "WR",
        team: "DAL",
        projectedPoints: 276.4,
      },
      {
        rank: 8,
        playerId: "demo-8",
        playerName: "Lamar Jackson",
        position: "QB",
        team: "BAL",
        projectedPoints: 358.9,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }
}
