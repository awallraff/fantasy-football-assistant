"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, X } from "lucide-react"
import type { SleeperRoster, SleeperUser } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"

interface EnhancedTeamRosterProps {
  roster: SleeperRoster
  user: SleeperUser
  leagueId: string
  isCurrentUser?: boolean
}

interface DisplayPlayer {
  player_id: string
  full_name: string
  position: string
  team: string
  injury_status?: string
}

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-gray-500" />
  }
}

const getInjuryBadgeColor = (status?: string) => {
  if (!status) return "default"
  switch (status.toLowerCase()) {
    case "out":
      return "destructive"
    case "doubtful":
      return "secondary"
    case "questionable":
      return "outline"
    default:
      return "default"
  }
}

export function EnhancedTeamRoster({ roster, user, leagueId, isCurrentUser = false }: EnhancedTeamRosterProps) {
  const [players, setPlayers] = useState<DisplayPlayer[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<DisplayPlayer | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const { getPlayer, getPlayerName, isLoading: playersLoading } = usePlayerData()

  useEffect(() => {
    const loadPlayers = () => {
      try {
        const allPlayerIds = [...(roster.players || []), ...(roster.starters || [])]
        const uniquePlayerIds = [...new Set(allPlayerIds)]

        const displayPlayers: DisplayPlayer[] = uniquePlayerIds
          .map((id) => {
            const player = getPlayer(id)
            if (!player) {
              return {
                player_id: id,
                full_name: getPlayerName(id),
                position: "UNKNOWN",
                team: "UNKNOWN",
              }
            }
            return {
              player_id: player.player_id,
              full_name: player.full_name || `${player.first_name} ${player.last_name}`,
              position: player.position,
              team: player.team,
              injury_status: player.injury_status,
            }
          })
          .filter(Boolean)

        setPlayers(displayPlayers)
      } catch (error) {
        console.error("Error loading players:", error)
      }
    }

    if (!playersLoading) {
      loadPlayers()
    }
  }, [roster, leagueId, getPlayer, getPlayerName, playersLoading])

  const starters = players.filter((p) => roster.starters?.includes(p.player_id))
  const bench = players.filter((p) => roster.players?.includes(p.player_id) && !roster.starters?.includes(p.player_id))

  if (playersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.display_name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.display_name?.charAt(0) || user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              {user.display_name || user.username}
              {isCurrentUser && <Badge variant="secondary">Your Team</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {roster.settings.wins}-{roster.settings.losses}
                {roster.settings.ties > 0 && `-${roster.settings.ties}`}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
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
                {starters.map((player) => (
                  <PlayerCard
                    key={player.player_id}
                    player={player}
                    isStarter={true}
                    onClick={() => setSelectedPlayer(player)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="bench" className="space-y-2">
                {bench.map((player) => (
                  <PlayerCard
                    key={player.player_id}
                    player={player}
                    isStarter={false}
                    onClick={() => setSelectedPlayer(player)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}

function PlayerCard({
  player,
  isStarter,
  onClick,
}: {
  player: DisplayPlayer
  isStarter: boolean
  onClick: () => void
}) {
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
          <div className="text-sm font-medium">{isStarter ? "Starter" : "Bench"}</div>
        </div>
      </div>
    </div>
  )
}

function PlayerDetailModal({
  player,
  onClose,
}: {
  player: DisplayPlayer
  onClose: () => void
}) {
  const { getPlayer } = usePlayerData()
  const detailedPlayer = getPlayer(player.player_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-background">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {player.full_name}
            <Badge variant="outline">{player.position}</Badge>
            <Badge variant="secondary">{player.team}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Badge variant={getInjuryBadgeColor(player.injury_status)}>{player.injury_status || "Healthy"}</Badge>
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

          <div className="text-center py-4 text-muted-foreground">Real player data loaded from Sleeper API</div>
        </CardContent>
      </Card>
    </div>
  )
}
