"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp, TrendingDown } from "lucide-react"
import type { SleeperRoster, SleeperUser, SleeperLeague } from "@/lib/sleeper-api"

interface TeamRosterCardProps {
  roster: SleeperRoster
  owner?: SleeperUser
  league: SleeperLeague
}

export function TeamRosterCard({ roster, owner, league }: TeamRosterCardProps) {
  const winPercentage =
    roster.settings.wins + roster.settings.losses > 0
      ? (roster.settings.wins / (roster.settings.wins + roster.settings.losses)) * 100
      : 0

  const avgPointsFor = roster.settings.fpts || 0
  const avgPointsAgainst = roster.settings.fpts_against || 0
  const pointsDiff = avgPointsFor - avgPointsAgainst

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{owner?.display_name || owner?.username || "Unknown Owner"}</CardTitle>
          <Badge variant={winPercentage >= 50 ? "default" : "secondary"}>
            {roster.settings.wins}-{roster.settings.losses}
            {roster.settings.ties > 0 && `-${roster.settings.ties}`}
          </Badge>
        </div>
        <CardDescription>
          Roster ID: {roster.roster_id} • {roster.players?.length || 0} players
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Win Rate</span>
            <span className="font-medium">{winPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={winPercentage} className="h-2" />
        </div>

        {/* Points Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Points For</span>
            </div>
            <p className="font-semibold">{avgPointsFor.toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-red-600" />
              <span className="text-gray-600 dark:text-gray-400">Points Against</span>
            </div>
            <p className="font-semibold">{avgPointsAgainst.toFixed(1)}</p>
          </div>
        </div>

        {/* Point Differential */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Point Differential</span>
          <div className="flex items-center gap-1">
            {pointsDiff >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`font-medium ${pointsDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {pointsDiff >= 0 ? "+" : ""}
              {pointsDiff.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Roster Size */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Active Roster</span>
            <span className="font-medium">
              {roster.players?.length || 0} / {league.roster_positions.length} slots
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
