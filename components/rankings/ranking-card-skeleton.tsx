"use client"

import { Card } from "@/components/ui/card"

/**
 * Skeleton loader for ranking cards that prevents CLS
 * Fixed height matches actual ranking card dimensions to prevent layout shift
 */
export function RankingCardSkeleton() {
  return (
    <Card className="p-4 overflow-hidden animate-pulse" style={{ minHeight: '140px' }}>
      <div className="space-y-3">
        {/* Top row: rank badge, player name, tier */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-3 flex-1">
            {/* Rank badge skeleton */}
            <div className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              {/* Player name skeleton */}
              <div className="h-5 bg-muted rounded w-3/4" />
              {/* Position and team skeleton */}
              <div className="flex gap-2">
                <div className="h-4 bg-muted rounded w-12" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            </div>
          </div>
          {/* Tier badge skeleton */}
          <div className="h-5 bg-muted rounded w-12 shrink-0" />
        </div>

        {/* Bottom row: projected points and status */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-32" />
          </div>
          <div className="shrink-0">
            <div className="h-5 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Renders multiple skeleton cards for loading state
 */
export function RankingCardsSkeletonList({ count = 10 }: { count?: number }) {
  return (
    <div className="md:hidden space-y-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <RankingCardSkeleton key={i} />
      ))}
    </div>
  )
}
