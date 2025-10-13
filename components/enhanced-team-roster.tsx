"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { SleeperRoster, SleeperUser } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { useProjections } from "@/contexts/projections-context"
import { PlayerCard, type DisplayPlayer } from "@/components/roster/player-card"
import { PlayerDetailModal } from "@/components/roster/player-detail-modal"

interface EnhancedTeamRosterProps {
  roster: SleeperRoster
  user: SleeperUser
  isCurrentUser?: boolean
}

export function EnhancedTeamRoster({ roster, user, isCurrentUser = false }: EnhancedTeamRosterProps) {
  const [players, setPlayers] = useState<DisplayPlayer[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<DisplayPlayer | null>(null)
  // Default to expanded for current user, collapsed for others
  const [isCollapsed, setIsCollapsed] = useState(!isCurrentUser)

  const { getPlayer, getPlayerName, isLoading: playersLoading } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers, isLoading: projectionsLoading } = useProjections()


  // Memoize player loading to prevent infinite re-renders
  const loadPlayers = useCallback(() => {
    if (playersLoading) return

    try {
      const allPlayerIds = [...(roster.players || []), ...(roster.starters || [])]
      const uniquePlayerIds = [...new Set(allPlayerIds)]

      const displayPlayers: DisplayPlayer[] = uniquePlayerIds
        .map((id) => {
          const player = getPlayer(id)
          const playerName = player?.full_name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim() || getPlayerName(id)
          
          // Get projections from context
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

  // Load projections when roster changes
  useEffect(() => {
    const allPlayerIds = [...(roster.players || []), ...(roster.starters || [])]
    const uniquePlayerIds = [...new Set(allPlayerIds)]
    
    if (uniquePlayerIds.length > 0 && !playersLoading) {
      // Create player names map
      const playerNames = new Map<string, string>()
      uniquePlayerIds.forEach(id => {
        const player = getPlayer(id)
        const playerName = player?.full_name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim() || getPlayerName(id)
        if (playerName) {
          playerNames.set(id, playerName)
        }
      })
      
      // Load projections for these players
      loadProjectionsForPlayers(uniquePlayerIds, playerNames)
    }
  }, [roster.players, roster.starters, playersLoading, getPlayer, getPlayerName, loadProjectionsForPlayers])

  // Load players when data changes
  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  const starters = players.filter((p) => roster.starters?.includes(p.player_id))
  const bench = players.filter((p) => roster.players?.includes(p.player_id) && !roster.starters?.includes(p.player_id))

  // Defensive check - ensure roster has player data
  const hasPlayers = (roster.players?.length ?? 0) > 0 || (roster.starters?.length ?? 0) > 0

  if (playersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            {user.display_name || user.username}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading player data...</div>
        </CardContent>
      </Card>
    )
  }

  // Show message if no players in roster
  if (!hasPlayers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            {user.display_name || user.username}
            {isCurrentUser && <Badge variant="secondary">Your Team</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No players found on this roster.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              {user.display_name || user.username}
              {isCurrentUser && <Badge variant="secondary">Your Team</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {roster.settings.wins}-{roster.settings.losses}
                {roster.settings.ties > 0 && `-${roster.settings.ties}`}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="min-w-[44px] min-h-[44px] p-2">
                {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {!isCollapsed && (
          <CardContent>
            <Tabs defaultValue="starters" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="starters">Starters ({starters.length})</TabsTrigger>
                <TabsTrigger value="bench">Bench ({bench.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="starters" className="space-y-2">
                {starters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No starters found
                  </div>
                ) : (
                  starters.map((player) => (
                    <PlayerCard
                      key={player.player_id}
                      player={player}
                      isStarter={true}
                      onClick={() => setSelectedPlayer(player)}
                      projectionsLoading={projectionsLoading}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="bench" className="space-y-2">
                {bench.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No bench players found
                  </div>
                ) : (
                  bench.map((player) => (
                    <PlayerCard
                      key={player.player_id}
                      player={player}
                      isStarter={false}
                      onClick={() => setSelectedPlayer(player)}
                      projectionsLoading={projectionsLoading}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}
