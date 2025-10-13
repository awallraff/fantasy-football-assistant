"use client"

/**
 * Standardized Card Component Variants (TASK-014)
 *
 * Consistent card patterns for league, player, and stat displays.
 *
 * Design Specs:
 * - LeagueCard: name, season, roster count, CTA
 * - StatCard: icon, label, value, trend indicator
 * - PlayerCard: player row + expanded info
 * - All cards use surface colors and 8px grid spacing
 *
 * Acceptance Criteria:
 * ✅ LeagueCard: name, season, roster count, CTA
 * ✅ StatCard: icon, label, value, trend indicator
 * ✅ PlayerCard: player row + expanded info
 * ✅ All cards use surface colors and 8px grid spacing
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlayerRow } from "@/components/player/player-row"
import { type PlayerRowData } from "@/lib/types/player-row-types"

/**
 * LeagueCard Component
 *
 * Card displaying league information with CTA button
 */
export interface LeagueCardProps {
  /** League name */
  leagueName: string

  /** Season year */
  season: string

  /** Number of rosters in league */
  rosterCount: number

  /** Optional league ID */
  leagueId?: string

  /** Optional call-to-action button */
  cta?: {
    label: string
    onClick: () => void
    variant?: "default" | "secondary" | "outline" | "ghost"
  }

  /** Additional metadata to display */
  metadata?: Array<{
    label: string
    value: string | number
  }>

  /** Additional CSS classes */
  className?: string

  /** Click handler for entire card */
  onClick?: () => void
}

export function LeagueCard({
  leagueName,
  season,
  rosterCount,
  leagueId: _leagueId,
  cta,
  metadata,
  className,
  onClick,
}: LeagueCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        // 8px grid spacing
        "p-compact-md",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-compact-sm">
        <CardTitle className="text-lg">{leagueName}</CardTitle>
        <CardDescription className="flex items-center gap-compact-xs">
          <Badge variant="secondary" className="text-xs">
            {season}
          </Badge>
          <span className="text-xs text-muted-foreground">{rosterCount} teams</span>
        </CardDescription>
      </CardHeader>

      {metadata && metadata.length > 0 && (
        <CardContent className="pb-compact-sm">
          <div className="grid grid-cols-2 gap-compact-sm text-sm">
            {metadata.map((item, index) => (
              <div key={index} className="space-y-compact-xs">
                <span className="text-muted-foreground text-xs">{item.label}</span>
                <div className="font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {cta && (
        <CardFooter className="pt-compact-sm">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              cta.onClick()
            }}
            variant={cta.variant || "default"}
            className="w-full"
            size="sm"
          >
            {cta.label}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

/**
 * StatCard Component
 *
 * Card displaying a statistic with icon, label, value, and optional trend
 */
export interface StatCardProps {
  /** Icon component to display */
  icon: LucideIcon

  /** Label for the statistic */
  label: string

  /** Value to display (can be string or number) */
  value: string | number

  /** Optional trend indicator */
  trend?: {
    direction: "up" | "down" | "stable"
    value?: string | number
    label?: string
  }

  /** Optional color variant */
  variant?: "default" | "positive" | "negative" | "warning"

  /** Additional CSS classes */
  className?: string

  /** Click handler */
  onClick?: () => void
}

export function StatCard({ icon: Icon, label, value, trend, variant = "default", className, onClick }: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    positive: "border-green-500/20 bg-green-500/5",
    negative: "border-red-500/20 bg-red-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
  }

  const iconColors = {
    default: "text-primary",
    positive: "text-green-600",
    negative: "text-red-600",
    warning: "text-amber-600",
  }

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-600" />
      case "stable":
        return <Minus className="h-3 w-3 text-amber-600" />
    }
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        // 8px grid spacing
        "p-compact-md",
        variantStyles[variant],
        onClick && "cursor-pointer transition-all hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 space-y-compact-sm">
        {/* Icon and Label */}
        <div className="flex items-center justify-between">
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              {trend.value && <span className="text-xs font-medium">{trend.value}</span>}
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {trend?.label && <div className="text-[10px] text-muted-foreground mt-0.5">{trend.label}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * PlayerCard Component (Enhanced)
 *
 * Card wrapping PlayerRow with optional expanded information
 */
export interface PlayerCardProps {
  /** Player data */
  player: PlayerRowData

  /** Whether player is starter */
  isStarter?: boolean

  /** Click handler for card */
  onClick?: () => void

  /** Loading state for projections */
  projectionsLoading?: boolean

  /** Optional expanded content */
  expandedContent?: React.ReactNode

  /** Whether card is expanded */
  expanded?: boolean

  /** Additional CSS classes */
  className?: string
}

export function PlayerCard({
  player,
  isStarter: _isStarter = false,
  onClick,
  projectionsLoading: _projectionsLoading = false,
  expandedContent,
  expanded = false,
  className,
}: PlayerCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        // 8px grid spacing
        "p-0",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      <div className="p-compact-sm">
        <PlayerRow
          player={player}
          onClick={onClick}
          displayOptions={{
            showHeadshot: false,
            showTeamLogo: true,
            showPosition: true,
            showStat: true,
            showSecondaryStat: false,
            compact: true,
          }}
        />
      </div>

      {expanded && expandedContent && (
        <div className="border-t bg-muted/30 p-compact-md space-y-compact-sm">{expandedContent}</div>
      )}
    </Card>
  )
}

/**
 * CardGrid Component
 *
 * Responsive grid layout for cards following 8px spacing system
 */
export interface CardGridProps {
  /** Child card components */
  children: React.ReactNode

  /** Number of columns on mobile (default: 1) */
  mobileCols?: 1 | 2

  /** Number of columns on tablet (default: 2) */
  tabletCols?: 2 | 3

  /** Number of columns on desktop (default: 3) */
  desktopCols?: 2 | 3 | 4

  /** Gap size (follows 8px grid) */
  gap?: "compact-xs" | "compact-sm" | "compact-md" | "compact-lg"

  /** Additional CSS classes */
  className?: string
}

export function CardGrid({
  children,
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3,
  gap = "compact-md",
  className,
}: CardGridProps) {
  const mobileColsClass = mobileCols === 1 ? "grid-cols-1" : "grid-cols-2"
  const tabletColsClass = tabletCols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
  const desktopColsClass =
    desktopCols === 2 ? "lg:grid-cols-2" : desktopCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"

  return (
    <div className={cn("grid", mobileColsClass, tabletColsClass, desktopColsClass, `gap-${gap}`, className)}>
      {children}
    </div>
  )
}
