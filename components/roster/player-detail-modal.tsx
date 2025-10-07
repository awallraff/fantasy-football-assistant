"use client"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePlayerData } from "@/contexts/player-data-context"
import { getInjuryBadgeColor } from "@/lib/player-utils"
import type { DisplayPlayer } from "./player-card"

interface PlayerDetailModalProps {
  player: DisplayPlayer
  onClose: () => void
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  const { getPlayer } = usePlayerData()
  const detailedPlayer = getPlayer(player.player_id)

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-auto" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {player.full_name}
            <Badge variant="outline">{player.position}</Badge>
            <Badge variant="secondary">{player.team}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{detailedPlayer?.years_exp || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Years Exp</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{detailedPlayer?.age || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Age</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{detailedPlayer?.college || "N/A"}</div>
              <div className="text-sm text-muted-foreground">College</div>
            </div>
            <div className="text-center">
              <Badge variant={getInjuryBadgeColor(player.injury_status)}>
                {player.injury_status || "Healthy"}
              </Badge>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>

          {/* Player Details */}
          {detailedPlayer && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Height:</span> {detailedPlayer.height || "N/A"}
              </div>
              <div>
                <span className="font-medium">Weight:</span> {detailedPlayer.weight || "N/A"}
              </div>
              <div>
                <span className="font-medium">Team:</span> {detailedPlayer.team}
              </div>
              <div>
                <span className="font-medium">Position:</span> {detailedPlayer.position}
              </div>
            </div>
          )}

          <div className="text-center py-4 text-muted-foreground">
            Real player data loaded from Sleeper API
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
