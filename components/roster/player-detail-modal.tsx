"use client"

/**
 * PlayerDetailModal Component (Legacy Wrapper)
 *
 * This component now wraps the enhanced PlayerDetailModal component (TASK-012)
 * for backward compatibility with existing code.
 *
 * New code should use PlayerDetailModal directly from @/components/player/player-detail-modal
 */

import { PlayerDetailModal as EnhancedPlayerDetailModal } from "@/components/player/player-detail-modal"
import type { DisplayPlayer } from "./player-card"

interface PlayerDetailModalProps {
  player: DisplayPlayer
  onClose: () => void
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  return (
    <EnhancedPlayerDetailModal
      player={player}
      onClose={onClose}
      leagueOwnership={[]}
      showCrossLeagueContext={false}
    />
  )
}
