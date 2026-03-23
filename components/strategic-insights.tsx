"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Loader2 } from "lucide-react"
import { sleeperAPI, type SleeperLeague } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { useProjections } from "@/contexts/projections-context"
import { buildRosterRows, rosterCompositionSummary } from "@/lib/league-roster-analysis"

interface StrategicInsightsProps {
  league: SleeperLeague
  userId: string
}

export function StrategicInsights({ league, userId }: StrategicInsightsProps) {
  const [loading, setLoading] = useState(true)
  const [bullets, setBullets] = useState<string[]>([])
  const [recordHint, setRecordHint] = useState("")
  const { getPlayer, getPlayerName } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers } = useProjections()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rosters = await sleeperAPI.getLeagueRosters(league.league_id)
      const userRoster = rosters.find((r) => r.owner_id === userId)
      if (!userRoster) {
        setBullets([])
        setRecordHint("")
        return
      }
      const ids = [...new Set([...(userRoster.players || []), ...(userRoster.starters || [])])]
      const nameMap = new Map(ids.map((id) => [id, getPlayerName(id)]))
      await loadProjectionsForPlayers(ids, nameMap)
      const rows = buildRosterRows(userRoster, getPlayer, getProjection)
      const { bullets: b, recordHint: h } = rosterCompositionSummary(rows, league)
      setBullets(b)
      setRecordHint(h)
    } catch (e) {
      console.error("Strategic insights:", e)
      setBullets([])
      setRecordHint("")
    } finally {
      setLoading(false)
    }
  }, [league, userId, getPlayer, getPlayerName, getProjection, loadProjectionsForPlayers])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <Card className="bg-background-elevated border-border">
        <CardHeader>
          <CardTitle className="text-ios-title-3 font-semibold">Strategic Insights</CardTitle>
          <CardDescription className="text-ios-subheadline text-text-secondary">
            Roster shape and projection snapshot for this league (from your synced rankings context)
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-ios-subheadline text-text-secondary">Analyzing your roster…</p>
            </div>
          ) : bullets.length === 0 ? (
            <>
              <Target className="h-16 w-16 mx-auto mb-4 text-text-secondary opacity-30" />
              <h3 className="text-ios-headline font-semibold mb-2 text-foreground">No roster found</h3>
              <p className="text-ios-subheadline text-text-secondary max-w-md mx-auto">
                We couldn&apos;t load your roster in this league. Confirm the selected league matches your Sleeper
                account.
              </p>
            </>
          ) : (
            <div className="text-left max-w-xl mx-auto space-y-4">
              <ul className="list-disc pl-5 space-y-2 text-ios-body text-foreground">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="text-ios-caption text-text-secondary border-t border-border pt-4">{recordHint}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
