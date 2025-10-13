"use client"

/**
 * PlayerCard Component (Legacy Wrapper)
 *
 * This component now wraps the standardized PlayerRow component (TASK-011)
 * for backward compatibility with existing code.
 *
 * New code should use PlayerRow directly from @/components/player/player-row
 */

import { PlayerRow, type PlayerRowData } from "@/components/player/player-row"

interface DisplayPlayer {
  player_id: string
  full_name: string
  position: string | null
  team: string | null
  injury_status?: string | null
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
    <PlayerRow
      player={player}
      isStarter={isStarter}
      onClick={onClick}
      projectionsLoading={projectionsLoading}
      showHeadshot={false}
      showPosition={true}
      showTeam={true}
      showProjection={true}
      showTier={true}
      showStatus={true}
      compact={false}
    />
  )
}

export type { DisplayPlayer }
