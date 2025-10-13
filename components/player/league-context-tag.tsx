"use client"

/**
 * League Context Tag Component (TASK-013)
 *
 * Small chip showing which league(s) a player status applies to.
 *
 * Design Specs:
 * - Compact design (Caption typography: 12px/16px)
 * - Color-coded by league (optional)
 * - Max-width defined (truncate long names)
 * - Shows count badge if multiple leagues
 *
 * Acceptance Criteria:
 * ✅ Props: league name, count (if multiple leagues)
 * ✅ Compact design (Caption typography)
 * ✅ Color-coded by league (optional)
 * ✅ Max-width defined (truncate long names)
 */

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface LeagueContextTagProps {
  /** League name to display */
  leagueName: string

  /** Optional: Number of leagues (shows count badge if > 1) */
  count?: number

  /** Optional: League ID for color-coding */
  leagueId?: string

  /** Optional: Variant style */
  variant?: "default" | "secondary" | "outline" | "destructive"

  /** Additional CSS classes */
  className?: string

  /** Compact mode (reduces padding) */
  compact?: boolean
}

/**
 * Generates a consistent color for a league based on its ID
 * Uses a hash of the league ID to pick from a palette of colors
 */
function getLeagueColor(leagueId?: string): string {
  if (!leagueId) return "hsl(var(--muted))"

  // Simple hash function
  let hash = 0
  for (let i = 0; i < leagueId.length; i++) {
    hash = (hash << 5) - hash + leagueId.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Color palette (HSL values for consistent saturation/lightness)
  const colors = [
    "hsl(200, 70%, 50%)", // Blue
    "hsl(280, 70%, 50%)", // Purple
    "hsl(160, 70%, 45%)", // Teal
    "hsl(30, 80%, 55%)", // Orange
    "hsl(340, 75%, 55%)", // Pink
    "hsl(120, 60%, 45%)", // Green
    "hsl(50, 80%, 50%)", // Yellow
    "hsl(260, 70%, 55%)", // Violet
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export function LeagueContextTag({
  leagueName,
  count,
  leagueId,
  variant = "secondary",
  className,
  compact = false,
}: LeagueContextTagProps) {
  const showCount = count && count > 1

  return (
    <Badge
      variant={variant}
      className={cn(
        // Caption typography (12px/16px)
        "text-xs leading-tight",
        // Compact sizing
        compact ? "px-1.5 py-0.5" : "px-2 py-0.5",
        // Max width with truncation
        "max-w-[120px] truncate",
        // Prevent text wrap
        "whitespace-nowrap",
        className
      )}
      style={
        leagueId && variant === "default"
          ? {
              backgroundColor: getLeagueColor(leagueId),
              color: "white",
              borderColor: "transparent",
            }
          : undefined
      }
      title={`${leagueName}${showCount ? ` (+${count - 1} more)` : ""}`}
    >
      {leagueName}
      {showCount && (
        <span className="ml-1 font-semibold opacity-75">+{count - 1}</span>
      )}
    </Badge>
  )
}

/**
 * LeagueContextTagGroup Component
 *
 * Displays multiple league tags in a horizontal scrollable container.
 * Useful for showing all leagues a player belongs to.
 */
export interface LeagueContextTagGroupProps {
  /** Array of leagues to display */
  leagues: Array<{
    leagueId: string
    leagueName: string
  }>

  /** Maximum number of tags to show before collapsing to count badge */
  maxVisible?: number

  /** Compact mode for all tags */
  compact?: boolean

  /** Additional CSS classes */
  className?: string
}

export function LeagueContextTagGroup({
  leagues,
  maxVisible = 3,
  compact = true,
  className,
}: LeagueContextTagGroupProps) {
  const visibleLeagues = leagues.slice(0, maxVisible)
  const remainingCount = leagues.length - maxVisible

  if (leagues.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {visibleLeagues.map((league) => (
        <LeagueContextTag
          key={league.leagueId}
          leagueId={league.leagueId}
          leagueName={league.leagueName}
          compact={compact}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs px-1.5 py-0.5 shrink-0">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
