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
    <Card className="bg-card hover:shadow-lg active:scale-[0.98] transition-all duration-ios border-border/50 shadow-md">
      <CardHeader className="pb-compact-sm">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-ios-title-3 text-foreground truncate">{league.name}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={league.status === "in_season" ? "default" : "secondary"} className="text-xs">
              {league.status.replace("_", " ")}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveLeague(league.league_id, `${league.name} (${league.season})`)
              }}
              className="h-[44px] w-[44px] p-0 text-text-secondary hover:text-destructive hover:bg-destructive/10 rounded-md"
              title={`Remove "${league.name}" from your leagues`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-ios-subheadline text-text-secondary">
          {league.total_rosters} teams • {league.season} season
        </CardDescription>
      </CardHeader>
      <CardContent className="cursor-pointer" onClick={() => onViewAnalytics(league)}>
        <div className="space-y-compact-sm">
          <div className="flex items-center justify-between text-ios-subheadline">
            <span className="text-text-secondary">Sport</span>
            <span className="font-medium uppercase text-foreground">{league.sport}</span>
          </div>
          <div className="flex items-center justify-between text-ios-subheadline">
            <span className="text-text-secondary">Season Type</span>
            <span className="font-medium text-foreground">{league.season_type}</span>
          </div>
          <Button
            className="w-full mt-compact-md min-h-[44px]"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation()
              onViewAnalytics(league)
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-ios-body">Loading...</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="text-ios-body">View Analytics</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
