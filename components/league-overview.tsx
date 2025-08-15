"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Target, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import type { SleeperLeague, SleeperRoster, SleeperUser } from "@/lib/sleeper-api"

interface LeagueOverviewProps {
  league: SleeperLeague
  rosters: SleeperRoster[]
  users: SleeperUser[]
}

export function LeagueOverview({ league, rosters, users }: LeagueOverviewProps) {
  // Calculate league stats
  const totalPoints = rosters.reduce((sum, roster) => sum + (roster.settings.fpts || 0), 0)
  const avgPoints = rosters.length > 0 ? totalPoints / rosters.length : 0
  const highestScorer = rosters.reduce(
    (highest, roster) => ((roster.settings.fpts || 0) > (highest.settings.fpts || 0) ? roster : highest),
    rosters[0],
  )
  const lowestScorer = rosters.reduce(
    (lowest, roster) => ((roster.settings.fpts || 0) < (lowest.settings.fpts || 0) ? roster : lowest),
    rosters[0],
  )

  const getOwnerName = (ownerId: string) => {
    const owner = users.find((u) => u.user_id === ownerId)
    return owner?.display_name || owner?.username || "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* League Info Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{league.total_rosters}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{avgPoints.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{league.season}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Season</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{league.settings.playoff_teams || "N/A"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Playoff Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* League Settings */}
      <Card>
        <CardHeader>
          <CardTitle>League Settings</CardTitle>
          <CardDescription>Key configuration and scoring settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Basic Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Teams:</span>
                  <span>{league.total_rosters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Playoff Teams:</span>
                  <span>{league.settings.playoff_teams || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Draft Rounds:</span>
                  <span>{league.settings.draft_rounds || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Roster Positions</h4>
              <div className="flex flex-wrap gap-1">
                {league.roster_positions.map((position, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {position}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Key Scoring</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(league.scoring_settings)
                  .filter(([key]) => ["pass_td", "rush_td", "rec_td", "pass_yd", "rush_yd", "rec_yd"].includes(key))
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Leaders */}
      {rosters.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Highest Scorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{highestScorer.settings.fpts?.toFixed(1) || "0"} pts</p>
                <p className="text-gray-600 dark:text-gray-400">{getOwnerName(highestScorer.owner_id)}</p>
                <div className="text-sm text-gray-500">
                  Record: {highestScorer.settings.wins}-{highestScorer.settings.losses}
                  {highestScorer.settings.ties > 0 && `-${highestScorer.settings.ties}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Lowest Scorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{lowestScorer.settings.fpts?.toFixed(1) || "0"} pts</p>
                <p className="text-gray-600 dark:text-gray-400">{getOwnerName(lowestScorer.owner_id)}</p>
                <div className="text-sm text-gray-500">
                  Record: {lowestScorer.settings.wins}-{lowestScorer.settings.losses}
                  {lowestScorer.settings.ties > 0 && `-${lowestScorer.settings.ties}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
