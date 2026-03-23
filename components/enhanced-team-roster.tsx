"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { SleeperRoster, SleeperUser } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { useProjections } from "@/contexts/projections-context"
import type { DisplayPlayer } from "@/components/roster/player-card"
import { PlayerDetailModal } from "@/components/roster/player-detail-modal"
import {
  TeamRosterSimpleHeader,
  TeamRosterEmptyHeader,
  TeamRosterMainHeader,
} from "@/components/roster/team-roster-card-shell"
import { TeamRosterStartersBenchTabs } from "@/components/roster/team-roster-starters-bench-tabs"

interface EnhancedTeamRosterProps {
  roster: SleeperRoster
  user: SleeperUser
  isCurrentUser?: boolean
}

export function EnhancedTeamRoster({ roster, user, isCurrentUser = false }: EnhancedTeamRosterProps) {
  const [players, setPlayers] = useState<DisplayPlayer[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<DisplayPlayer | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(!isCurrentUser)

  const { getPlayer, getPlayerName, isLoading: playersLoading } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers, isLoading: projectionsLoading } = useProjections()

  const loadPlayers = useCallback(() => {
    if (playersLoading) return

    try {
      const allPlayerIds = [...(roster.players || []), ...(roster.starters || [])]
      const uniquePlayerIds = [...new Set(allPlayerIds)]

      const displayPlayers: DisplayPlayer[] = uniquePlayerIds
        .map((id) => {
          const player = getPlayer(id)
          const playerName =
            player?.full_name || `${player?.first_name || ""} ${player?.last_name || ""}`.trim() || getPlayerName(id)

          const projection = getProjection(id, playerName)

          if (!player) {
            return {
              player_id: id,
              full_name: playerName,
              position: "UNKNOWN",
              team: "UNKNOWN",
              weeklyProjection: projection?.weeklyProjection,
              tier: projection?.tier,
            }
          }
          return {
            player_id: player.player_id,
            full_name: playerName,
            position: player.position,
            team: player.team,
            injury_status: player.injury_status,
            weeklyProjection: projection?.weeklyProjection,
            tier: projection?.tier,
          }
        })
        .filter(Boolean)

      setPlayers(displayPlayers)
    } catch (error) {
      console.error("Error loading players:", error)
    }
  }, [playersLoading, roster.players, roster.starters, getPlayer, getPlayerName, getProjection])

  useEffect(() => {
    const allPlayerIds = [...(roster.players || []), ...(roster.starters || [])]
    const uniquePlayerIds = [...new Set(allPlayerIds)]

    if (uniquePlayerIds.length > 0 && !playersLoading) {
      const playerNames = new Map<string, string>()
      uniquePlayerIds.forEach((id) => {
        const player = getPlayer(id)
        const playerName =
          player?.full_name || `${player?.first_name || ""} ${player?.last_name || ""}`.trim() || getPlayerName(id)
        if (playerName) {
          playerNames.set(id, playerName)
        }
      })

      loadProjectionsForPlayers(uniquePlayerIds, playerNames)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster.players, roster.starters, playersLoading])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  const starters = players.filter((p) => roster.starters?.includes(p.player_id))
  const bench = players.filter(
    (p) => roster.players?.includes(p.player_id) && !roster.starters?.includes(p.player_id)
  )

  const hasPlayers = (roster.players?.length ?? 0) > 0 || (roster.starters?.length ?? 0) > 0

  if (playersLoading) {
    return (
      <Card className="border-border/50 bg-card shadow-md">
        <CardHeader>
          <TeamRosterSimpleHeader user={user} />
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-ios-body text-text-secondary">Loading player data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!hasPlayers) {
    return (
      <Card className="border-border/50 bg-card shadow-md">
        <CardHeader>
          <TeamRosterEmptyHeader user={user} isCurrentUser={isCurrentUser} />
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-ios-body text-text-secondary">No players found on this roster.</div>
        </CardContent>
      </Card>
    )
  }

  const { wins, losses, ties } = roster.settings

  return (
    <div className="space-y-compact-md">
      <Card className="border-border/50 bg-card shadow-md">
        <CardHeader>
          <TeamRosterMainHeader
            user={user}
            isCurrentUser={isCurrentUser}
            wins={wins}
            losses={losses}
            ties={ties}
            isCollapsed={isCollapsed}
            onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
          />
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="pt-6">
            <TeamRosterStartersBenchTabs
              starters={starters}
              bench={bench}
              projectionsLoading={projectionsLoading}
              onSelectPlayer={setSelectedPlayer}
            />
          </CardContent>
        )}
      </Card>

      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}
