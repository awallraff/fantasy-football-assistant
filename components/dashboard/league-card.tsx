"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, BarChart3, Trash2 } from "lucide-react"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface LeagueCardProps {
  league: SleeperLeague
  loading: boolean
  onViewAnalytics: (league: SleeperLeague) => void
  onRemoveLeague: (leagueId: string, leagueName?: string) => void
}

export function LeagueCard({ league, loading, onViewAnalytics, onRemoveLeague }: LeagueCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-card-foreground">{league.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={league.status === "in_season" ? "default" : "secondary"}>
              {league.status.replace("_", " ")}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveLeague(league.league_id, `${league.name} (${league.season})`)
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={`Remove "${league.name}" from your leagues`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {league.total_rosters} teams • {league.season} season
        </CardDescription>
      </CardHeader>
      <CardContent className="cursor-pointer" onClick={() => onViewAnalytics(league)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sport</span>
            <span className="font-medium uppercase text-foreground">{league.sport}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Season Type</span>
            <span className="font-medium text-foreground">{league.season_type}</span>
          </div>
          <Button
            className="w-full mt-4"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation()
              onViewAnalytics(league)
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
