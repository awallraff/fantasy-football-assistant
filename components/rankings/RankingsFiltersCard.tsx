"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RankingSystem } from "@/lib/rankings-types"

/**
 * Props interface for RankingsFiltersCard component
 */
export interface RankingsFiltersCardProps {
  selectedSource: "all" | "user" | "ai"
  selectedPosition: string
  selectedSystem: RankingSystem | null
  projectionType: "season" | "weekly"
  sortBy: "rank" | "name" | "position" | "team" | "projectedPoints"
  sortDirection: "asc" | "desc"
  availablePositions: string[]
  availableSystems: RankingSystem[]
  isLoading: boolean
  onSourceChange: (source: "all" | "user" | "ai") => void
  onPositionChange: (position: string) => void
  onSystemChange: (systemId: string) => void
  onProjectionTypeChange: (type: "season" | "weekly") => void
  onSortByChange: (sortBy: "rank" | "name" | "position" | "team" | "projectedPoints") => void
  onSortDirectionChange: (direction: "asc" | "desc") => void
}

/**
 * RankingsFiltersCard Component
 *
 * Provides comprehensive filtering controls for the rankings page including:
 * - Ranking source selection (All/User/AI)
 * - Position filtering
 * - Ranking system selection
 * - AI projection type (Season/Weekly)
 * - Sort field and direction
 *
 * @component
 * @example
 * ```tsx
 * <RankingsFiltersCard
 *   selectedSource={selectedSource}
 *   selectedPosition={selectedPosition}
 *   selectedSystem={selectedSystem}
 *   projectionType={projectionType}
 *   sortBy={sortBy}
 *   sortDirection={sortDirection}
 *   availablePositions={getAllPositions()}
 *   availableSystems={getAllSystems()}
 *   isLoading={isLoading}
 *   onSourceChange={setSelectedSource}
 *   onPositionChange={setSelectedPosition}
 *   onSystemChange={handleSystemChange}
 *   onProjectionTypeChange={handleProjectionTypeChange}
 *   onSortByChange={setSortBy}
 *   onSortDirectionChange={setSortDirection}
 * />
 * ```
 */
export const RankingsFiltersCard = React.memo<RankingsFiltersCardProps>(
  ({
    selectedSource,
    selectedPosition,
    selectedSystem,
    projectionType,
    sortBy,
    sortDirection,
    availablePositions,
    availableSystems,
    isLoading,
    onSourceChange,
    onPositionChange,
    onSystemChange,
    onProjectionTypeChange,
    onSortByChange,
    onSortDirectionChange,
  }) => {
    // Determine placeholder text for system selector
    const getSystemPlaceholder = (): string => {
      if (availableSystems.length === 0) {
        if (selectedSource === "ai") return "Generate AI rankings first"
        if (selectedSource === "user") return "Import user rankings first"
        return "No rankings available"
      }
      return "Select system"
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ranking Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Ranking Source Filter */}
            <div>
              <label
                htmlFor="ranking-source-select"
                className="text-sm font-medium mb-2 block"
              >
                Ranking Source
              </label>
              <Select
                value={selectedSource}
                onValueChange={(value: "all" | "user" | "ai") => onSourceChange(value)}
              >
                <SelectTrigger id="ranking-source-select" aria-label="Select ranking source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="user">User Imported</SelectItem>
                  <SelectItem value="ai">AI Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position Filter */}
            <div>
              <label
                htmlFor="position-select"
                className="text-sm font-medium mb-2 block"
              >
                Position
              </label>
              <Select value={selectedPosition} onValueChange={onPositionChange}>
                <SelectTrigger id="position-select" aria-label="Select position filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {availablePositions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ranking System Selector */}
            <div>
              <label
                htmlFor="ranking-system-select"
                className="text-sm font-medium mb-2 block"
              >
                Ranking System
              </label>
              <Select
                value={selectedSystem?.id || undefined}
                onValueChange={onSystemChange}
              >
                <SelectTrigger
                  id="ranking-system-select"
                  aria-label="Select ranking system"
                >
                  <SelectValue placeholder={getSystemPlaceholder()} />
                </SelectTrigger>
                <SelectContent>
                  {availableSystems.length > 0 ? (
                    availableSystems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {getSystemPlaceholder()}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* AI Projection Type */}
            <div>
              <label
                htmlFor="projection-type-select"
                className="text-sm font-medium mb-2 block"
              >
                AI Projection Type
              </label>
              <Select
                value={projectionType}
                onValueChange={(value: "season" | "weekly") =>
                  onProjectionTypeChange(value)
                }
                disabled={selectedSource !== "ai" || isLoading}
              >
                <SelectTrigger
                  id="projection-type-select"
                  aria-label="Select AI projection type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Projections</SelectItem>
                  <SelectItem value="season">Season Projections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Field */}
            <div>
              <label
                htmlFor="sort-by-select"
                className="text-sm font-medium mb-2 block"
              >
                Sort By
              </label>
              <Select
                value={sortBy}
                onValueChange={(
                  value: "rank" | "name" | "position" | "team" | "projectedPoints"
                ) => onSortByChange(value)}
              >
                <SelectTrigger id="sort-by-select" aria-label="Select sort field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="name">Player Name</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="projectedPoints">Projected Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div>
              <label
                htmlFor="sort-direction-select"
                className="text-sm font-medium mb-2 block"
              >
                Sort Direction
              </label>
              <Select
                value={sortDirection}
                onValueChange={(value: "asc" | "desc") =>
                  onSortDirectionChange(value)
                }
              >
                <SelectTrigger
                  id="sort-direction-select"
                  aria-label="Select sort direction"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

RankingsFiltersCard.displayName = "RankingsFiltersCard"
