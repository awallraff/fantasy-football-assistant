"use client"

/**
 * PlayerCard Component (Legacy Wrapper)
 *
 * This component now wraps the standardized PlayerRow component (TASK-011)
 * for backward compatibility with existing code.
 *
 * New code should use PlayerRow directly from @/components/player/player-row
 */

import { PlayerRow } from "@/components/player/player-row"
import { type PlayerRowData } from "@/lib/types/player-row-types"

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

export function PlayerCard({ player, isStarter: _isStarter, onClick, projectionsLoading: _projectionsLoading }: PlayerCardProps) {
  // Convert legacy DisplayPlayer to PlayerRowData
  const playerRowData: PlayerRowData = {
    playerId: player.player_id,
    name: player.full_name,
    position: (player.position || 'FLEX') as PlayerRowData['position'],
    team: player.team || undefined,
    headshotUrl: undefined,
    keyStat: player.projectedPoints?.toFixed(1),
    secondaryStat: player.tier ? `Tier ${player.tier}` : undefined,
  }

  return (
    <PlayerRow
      player={playerRowData}
      onClick={() => onClick()}
      displayOptions={{
        showHeadshot: false,
        showTeamLogo: true,
        showPosition: true,
        showStat: true,
        showSecondaryStat: true,
        compact: false,
      }}
    />
  )
}

export type { DisplayPlayer }
