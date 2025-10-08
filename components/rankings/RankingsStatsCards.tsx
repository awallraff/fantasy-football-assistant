"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Brain } from "lucide-react"

/**
 * Props interface for RankingsStatsCards component
 */
export interface RankingsStatsCardsProps {
  userSystemsCount: number
  externalApisCount: number
  filteredPlayersCount: number
  isLoading: boolean
}

/**
 * Individual stat card component
 */
interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, badge }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        {badge && (
          <Badge variant={badge.variant || "secondary"} className="text-xs">
            {badge.text}
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
)

/**
 * RankingsStatsCards Component
 *
 * Displays key statistics about available ranking systems in a grid layout:
 * - User imported systems count
 * - External API systems count (with availability badge)
 * - Filtered players count
 *
 * @component
 * @example
 * ```tsx
 * <RankingsStatsCards
 *   userSystemsCount={userRankingSystems.length}
 *   externalApisCount={0}
 *   filteredPlayersCount={filteredRankings.length}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const RankingsStatsCards = React.memo<RankingsStatsCardsProps>(
  ({ userSystemsCount, externalApisCount, filteredPlayersCount, isLoading }) => {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* User Imported Systems */}
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />}
          value={userSystemsCount}
          label="User Imported"
        />

        {/* External APIs */}
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />}
          value={externalApisCount}
          label="External APIs"
          badge={{
            text: isLoading ? "Loading..." : "Available",
            variant: "secondary",
          }}
        />

        {/* Filtered Players */}
        <StatCard
          icon={<Brain className="h-5 w-5 text-primary" aria-hidden="true" />}
          value={filteredPlayersCount}
          label="Filtered Players"
        />
      </div>
    )
  }
)

RankingsStatsCards.displayName = "RankingsStatsCards"
