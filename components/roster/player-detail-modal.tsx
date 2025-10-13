"use client"

/**
 * PlayerDetailModal Component (Legacy Wrapper)
 *
 * This component now wraps the enhanced PlayerDetailModal component (TASK-012)
 * for backward compatibility with existing code.
 *
 * New code should use PlayerDetailModal directly from @/components/player/player-detail-modal
 */

import { PlayerDetailModal as EnhancedPlayerDetailModal, type PlayerDetailModalData } from "@/components/player/player-detail-modal"
import type { DisplayPlayer } from "./player-card"

interface PlayerDetailModalProps {
  player: DisplayPlayer
  onClose: () => void
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  // Convert DisplayPlayer to PlayerDetailModalData
  const modalData: PlayerDetailModalData = {
    player_id: player.player_id,
    full_name: player.full_name,
    position: player.position,
    team: player.team,
    injury_status: player.injury_status,
    weeklyProjection: player.weeklyProjection || player.projectedPoints,
    tier: player.tier,
  }

  return (
    <EnhancedPlayerDetailModal
      player={modalData}
      onClose={onClose}
      leagueOwnership={[]}
      showCrossLeagueContext={false}
    />
  )
}
