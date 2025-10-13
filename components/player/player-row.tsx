"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp, User } from "lucide-react"
import { getInjuryBadgeColor } from "@/lib/player-utils"
import { cn } from "@/lib/utils"

/**
 * Standardized Player Row Component (TASK-011)
 *
 * A compact, scannable player row optimized for roster/rankings display.
 *
 * Design Specs:
 * - 44px minimum height (touch target compliance)
 * - Mobile-optimized (works on 375px viewport)
 * - High information density with icon-first design
 * - Position badge, team logo, key stats
 * - Tappable (opens player detail modal)
 *
 * Acceptance Criteria:
 * ✅ Props: player data, show controls (headshot, position, team, stats)
 * ✅ 44px minimum height (touch target)
 * ✅ Mobile-optimized (works on 375px)
 * ✅ Includes position badge, team badge, key stat
 * ✅ Tappable (opens player detail modal)
 */

export interface PlayerRowData {
  player_id: string
  full_name: string
  position: string | null
  team: string | null
  injury_status?: string | null
  weeklyProjection?: number
  tier?: number
  projectedPoints?: number
}

export interface PlayerRowProps {
  /** Player data to display */
  player: PlayerRowData

  /** Whether this player is in starting lineup */
  isStarter?: boolean

  /** Callback when row is clicked */
  onClick?: () => void

  /** Show loading state for projections */
  projectionsLoading?: boolean

  /** Show player headshot (avatar) */
  showHeadshot?: boolean

  /** Show position badge */
  showPosition?: boolean

  /** Show team badge */
  showTeam?: boolean

  /** Show weekly projection */
  showProjection?: boolean

  /** Show tier badge */
  showTier?: boolean

  /** Show starter/bench status */
  showStatus?: boolean

  /** Additional CSS classes */
  className?: string

  /** Compact mode (reduces padding for dense lists) */
  compact?: boolean
}

export function PlayerRow({
  player,
  isStarter = false,
  onClick,
  projectionsLoading = false,
  showHeadshot = false,
  showPosition = true,
  showTeam = true,
  showProjection = true,
  showTier = true,
  showStatus = true,
  className,
  compact = false,
}: PlayerRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
        "min-h-[44px]", // WCAG 2.1 AA touch target
        compact ? "p-2 md:p-2.5" : "p-2.5 md:p-3",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-label={`View details for ${player.full_name}, ${player.position}, ${player.team}`}
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Optional Player Headshot */}
        {showHeadshot && (
          <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {/* Player Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <span className="font-medium truncate">{player.full_name}</span>

            {/* Position Badge */}
            {showPosition && (
              <Badge
                variant="outline"
                className="text-[10px] md:text-xs px-1.5 py-0.5 shrink-0"
              >
                {player.position || 'N/A'}
              </Badge>
            )}

            {/* Team Badge */}
            {showTeam && (
              <Badge
                variant="secondary"
                className="text-[10px] md:text-xs px-1.5 py-0.5 shrink-0"
              >
                {player.team || 'FA'}
              </Badge>
            )}
          </div>

          {/* Injury Status */}
          {player.injury_status && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant={getInjuryBadgeColor(player.injury_status)}
                className="text-[10px] md:text-xs px-1.5 py-0.5"
              >
                {player.injury_status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Stats & Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          {/* Projection Loading State */}
          {projectionsLoading ? (
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              <span className="text-xs text-muted-foreground hidden md:inline">Loading...</span>
            </div>
          ) : (
            <>
              {/* Weekly Projection */}
              {showProjection && player.weeklyProjection && (
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-blue-600">
                    {player.weeklyProjection.toFixed(1)}
                  </span>

                  {/* Tier Badge */}
                  {showTier && player.tier && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 ml-1">
                      T{player.tier}
                    </Badge>
                  )}
                </div>
              )}

              {/* Starter/Bench Status */}
              {showStatus && (
                <Badge
                  variant={isStarter ? "default" : "secondary"}
                  className="text-[10px] md:text-xs px-1.5 py-0.5"
                >
                  {isStarter ? "S" : "B"}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Export DisplayPlayer type alias for backward compatibility
 * with existing components (player-card.tsx)
 */
export type DisplayPlayer = PlayerRowData
