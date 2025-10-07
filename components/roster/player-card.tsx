"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { getInjuryBadgeColor } from "@/lib/player-utils"

interface DisplayPlayer {
  player_id: string
  full_name: string
  position: string
  team: string
  injury_status?: string
  projectedPoints?: number
  tier?: number
  weeklyProjection?: number
}

interface PlayerCardProps {
  player: DisplayPlayer
  isStarter: boolean
  onClick: () => void
  projectionsLoading?: boolean
}

export function PlayerCard({ player, isStarter, onClick, projectionsLoading }: PlayerCardProps) {
  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{player.full_name}</span>
            <Badge variant="outline" className="text-xs">
              {player.position}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {player.team}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {player.injury_status && (
              <Badge variant={getInjuryBadgeColor(player.injury_status)} className="text-xs">
                {player.injury_status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right">
          {projectionsLoading ? (
            <div className="flex items-center gap-1 mb-1">
              <div className="h-3 w-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : player.weeklyProjection ? (
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                {player.weeklyProjection.toFixed(1)} pts
              </span>
              {player.tier && (
                <Badge variant="outline" className="text-xs">
                  T{player.tier}
                </Badge>
              )}
            </div>
          ) : null}
          <div className="text-sm font-medium">{isStarter ? "Starter" : "Bench"}</div>
        </div>
      </div>
    </div>
  )
}

export type { DisplayPlayer }
