"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"
import type { SleeperRoster, SleeperUser, SleeperLeague } from "@/lib/sleeper-api"

interface StandingsTableProps {
  rosters: SleeperRoster[]
  users: SleeperUser[]
  league: SleeperLeague
}

export function StandingsTable({ rosters, users, league }: StandingsTableProps) {
  const getOwnerName = (ownerId: string) => {
    const owner = users.find((u) => u.user_id === ownerId)
    return owner?.display_name || owner?.username || "Unknown"
  }

  // Sort rosters by wins, then by points for
  const sortedRosters = [...rosters].sort((a, b) => {
    if (a.settings.wins !== b.settings.wins) {
      return b.settings.wins - a.settings.wins
    }
    return (b.settings.fpts || 0) - (a.settings.fpts || 0)
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <span className="w-4 text-center text-sm font-medium">{rank}</span>
    }
  }

  const getPlayoffStatus = (rank: number) => {
    const playoffTeams = league.settings.playoff_teams || 6
    if (rank <= playoffTeams) {
      return (
        <Badge variant="default" className="text-xs">
          Playoff
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Out
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Standings</CardTitle>
        <CardDescription>Current season rankings and playoff picture</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 dark:text-gray-400 pb-2 border-b">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-2">Record</div>
            <div className="col-span-2">Points For</div>
            <div className="col-span-2">Points Against</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Standings Rows */}
          {sortedRosters.map((roster, index) => {
            const rank = index + 1
            const winPercentage =
              roster.settings.wins + roster.settings.losses > 0
                ? (roster.settings.wins / (roster.settings.wins + roster.settings.losses)) * 100
                : 0

            return (
              <div
                key={roster.roster_id}
                className="grid grid-cols-12 gap-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2"
              >
                <div className="col-span-1 flex items-center">{getRankIcon(rank)}</div>

                <div className="col-span-4 flex items-center">
                  <div>
                    <p className="font-medium">{getOwnerName(roster.owner_id)}</p>
                    <p className="text-xs text-gray-500">{winPercentage.toFixed(1)}% win rate</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="font-medium">
                    {roster.settings.wins}-{roster.settings.losses}
                    {roster.settings.ties > 0 && `-${roster.settings.ties}`}
                  </span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="font-medium">{(roster.settings.fpts || 0).toFixed(1)}</span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="font-medium">{(roster.settings.fpts_against || 0).toFixed(1)}</span>
                </div>

                <div className="col-span-1 flex items-center">{getPlayoffStatus(rank)}</div>
              </div>
            )
          })}
        </div>

        {/* Playoff Line Indicator */}
        {league.settings.playoff_teams && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Top {league.settings.playoff_teams} teams make playoffs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
