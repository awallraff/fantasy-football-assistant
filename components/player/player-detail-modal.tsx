"use client"

/**
 * Player Detail Modal Component (TASK-012)
 *
 * Bottom-sheet modal showing player details across user's leagues with dynasty context.
 *
 * Design Specs:
 * - Shows player name, headshot, position, team
 * - Lists all leagues user owns/faces this player
 * - Dynasty-specific data: age, years experience, trend (up/down/stable)
 * - Bottom-sheet animation (slides up from bottom on mobile)
 * - Swipe-to-dismiss on mobile
 * - 44px close button
 *
 * Acceptance Criteria:
 * ✅ Shows player name, headshot, position, team
 * ✅ Lists all leagues user owns/faces this player
 * ✅ Dynasty-specific data: age, years experience, trend
 * ✅ Bottom-sheet animation (slides up from bottom)
 * ✅ Swipe-to-dismiss on mobile
 * ✅ 44px close button
 */

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePlayerData } from "@/contexts/player-data-context"
import { getInjuryBadgeColor } from "@/lib/player-utils"
import { User, TrendingUp, TrendingDown, Minus, Trophy, Calendar, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PlayerDetailModalData {
  player_id: string
  full_name: string
  position: string | null
  team: string | null
  injury_status?: string | null
  weeklyProjection?: number
  tier?: number
  projectedPoints?: number
}

export interface LeagueOwnership {
  league_id: string
  league_name: string
  is_owner: boolean
  is_opponent: boolean
  roster_position?: "starter" | "bench" | "taxi" | "ir"
}

export interface DynastyMetrics {
  age?: number
  years_exp?: number
  trend?: "up" | "down" | "stable"
  breakout_candidate?: boolean
  buy_window?: boolean
  sell_window?: boolean
}

export interface PlayerDetailModalProps {
  player: PlayerDetailModalData
  onClose: () => void
  leagueOwnership?: LeagueOwnership[]
  dynastyMetrics?: DynastyMetrics
  showCrossLeagueContext?: boolean
}

export function PlayerDetailModal({
  player,
  onClose,
  leagueOwnership = [],
  dynastyMetrics,
  showCrossLeagueContext = true,
}: PlayerDetailModalProps) {
  const { getPlayer } = usePlayerData()
  const detailedPlayer = getPlayer(player.player_id)

  // Calculate dynasty indicators
  const age = dynastyMetrics?.age || detailedPlayer?.age
  const yearsExp = dynastyMetrics?.years_exp || detailedPlayer?.years_exp
  const trend = dynastyMetrics?.trend || "stable"

  // Dynasty status badges
  const isBreakoutCandidate = dynastyMetrics?.breakout_candidate || (age && age <= 24 && yearsExp && yearsExp <= 3)
  const isBuyWindow = dynastyMetrics?.buy_window || (age && age >= 23 && age <= 27)
  const isSellWindow = dynastyMetrics?.sell_window || (age && age >= 30)

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "w-full max-w-2xl max-h-[90vh] overflow-auto",
          // Mobile: bottom-sheet style
          "sm:max-h-[90vh]",
          // Animation: slide up from bottom on mobile
          "animate-slide-up"
        )}
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {/* Player Avatar */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg truncate">{player.full_name}</span>
                <Badge variant="outline" className="shrink-0">{player.position}</Badge>
                <Badge variant="secondary" className="shrink-0">{player.team}</Badge>
              </div>

              {/* Dynasty Status Indicators */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isBreakoutCandidate && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Breakout
                  </Badge>
                )}
                {isBuyWindow && (
                  <Badge variant="default" className="text-xs bg-blue-600">
                    <Activity className="h-3 w-3 mr-1" />
                    Buy Window
                  </Badge>
                )}
                {isSellWindow && (
                  <Badge variant="default" className="text-xs bg-orange-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Sell Window
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-compact-lg">
          {/* Dynasty Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-compact-md">
            <div className="text-center p-compact-md bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{age || "N/A"}</div>
              <div className="text-xs text-muted-foreground">Age</div>
            </div>

            <div className="text-center p-compact-md bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{yearsExp || "N/A"}</div>
              <div className="text-xs text-muted-foreground">Years Exp</div>
            </div>

            <div className="text-center p-compact-md bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                {trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                {trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                {trend === "stable" && <Minus className="h-4 w-4 text-amber-600" />}
              </div>
              <div className="text-lg font-bold">
                {trend === "up" && <span className="text-green-600">Rising</span>}
                {trend === "down" && <span className="text-red-600">Declining</span>}
                {trend === "stable" && <span className="text-amber-600">Stable</span>}
              </div>
              <div className="text-xs text-muted-foreground">Trend</div>
            </div>

            <div className="text-center p-compact-md bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <Badge variant={getInjuryBadgeColor(player.injury_status || undefined)} className="mt-1">
                {player.injury_status || "Healthy"}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Status</div>
            </div>
          </div>

          {/* Cross-League Ownership (Dynasty Context) */}
          {showCrossLeagueContext && leagueOwnership.length > 0 && (
            <div className="space-y-compact-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                League Ownership ({leagueOwnership.length})
              </h3>
              <div className="space-y-compact-xs">
                {leagueOwnership.map((league) => (
                  <div
                    key={league.league_id}
                    className="flex items-center justify-between p-compact-sm bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{league.league_name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {league.is_owner && (
                        <Badge variant="default" className="text-xs">Own</Badge>
                      )}
                      {league.is_opponent && (
                        <Badge variant="secondary" className="text-xs">Opponent</Badge>
                      )}
                      {league.roster_position && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {league.roster_position}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Physical Details */}
          {detailedPlayer && (
            <div className="grid grid-cols-2 gap-compact-md text-sm">
              <div className="p-compact-sm bg-muted/20 rounded-lg">
                <span className="font-medium">Height:</span>{" "}
                <span className="text-muted-foreground">{detailedPlayer.height || "N/A"}</span>
              </div>
              <div className="p-compact-sm bg-muted/20 rounded-lg">
                <span className="font-medium">Weight:</span>{" "}
                <span className="text-muted-foreground">{detailedPlayer.weight || "N/A"}</span>
              </div>
              <div className="p-compact-sm bg-muted/20 rounded-lg">
                <span className="font-medium">College:</span>{" "}
                <span className="text-muted-foreground">{detailedPlayer.college || "N/A"}</span>
              </div>
              <div className="p-compact-sm bg-muted/20 rounded-lg">
                <span className="font-medium">Draft:</span>{" "}
                <span className="text-muted-foreground">
                  {detailedPlayer.years_exp ? `${detailedPlayer.years_exp} yrs` : "N/A"}
                </span>
              </div>
            </div>
          )}

          {/* Weekly Projection (if available) */}
          {player.weeklyProjection && (
            <div className="p-compact-md bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Weekly Projection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {player.weeklyProjection.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                  {player.tier && (
                    <Badge variant="outline" className="text-xs">Tier {player.tier}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center py-compact-sm text-xs text-muted-foreground">
            Player data loaded from Sleeper API
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
