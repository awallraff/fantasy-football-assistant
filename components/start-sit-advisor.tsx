"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"
import { sleeperAPI, type SleeperLeague } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { useProjections } from "@/contexts/projections-context"
import { buildRosterRows, buildStartSitDecisions } from "@/lib/league-roster-analysis"

interface StartSitAdvisorProps {
  league: SleeperLeague
  userId: string
}

interface StartSitDecision {
  playerId: string
  name: string
  position: string
  team: string
  opponent: string
  recommendation: "start" | "sit" | "flex"
  confidence: number
  projectedPoints: number
  reasoning: string[]
  matchupGrade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F"
  riskLevel: "low" | "medium" | "high"
  weatherConcern?: boolean
  injuryStatus?: "healthy" | "questionable" | "doubtful"
}

export function StartSitAdvisor({ league, userId }: StartSitAdvisorProps) {
  const [decisions, setDecisions] = useState<StartSitDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [week, setWeek] = useState<string>("current")
  const { getPlayer, getPlayerName } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers } = useProjections()

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    try {
      const rosters = await sleeperAPI.getLeagueRosters(league.league_id)
      const userRoster = rosters.find((r) => r.owner_id === userId)
      if (!userRoster) {
        setDecisions([])
        return
      }
      const ids = [...new Set([...(userRoster.players || []), ...(userRoster.starters || [])])]
      const nameMap = new Map(ids.map((id) => [id, getPlayerName(id)]))
      await loadProjectionsForPlayers(ids, nameMap)
      const rows = buildRosterRows(userRoster, getPlayer, getProjection)
      setDecisions(buildStartSitDecisions(rows))
    } catch (e) {
      console.error("Start/sit advisor:", e)
      setDecisions([])
    } finally {
      setLoading(false)
    }
  }, [league.league_id, userId, getPlayer, getPlayerName, getProjection, loadProjectionsForPlayers])

  useEffect(() => {
    void runAnalysis()
  }, [runAnalysis])

  const filteredDecisions = decisions.filter((decision) => {
    if (selectedPosition === "all") return true
    return decision.position === selectedPosition
  })

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "start":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "sit":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "flex":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "start":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "sit":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "flex":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600"
    if (grade.startsWith("B")) return "text-blue-600"
    if (grade.startsWith("C")) return "text-yellow-600"
    if (grade.startsWith("D")) return "text-orange-600"
    return "text-red-600"
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="QB">QB</SelectItem>
                <SelectItem value="RB">RB</SelectItem>
                <SelectItem value="WR">WR</SelectItem>
                <SelectItem value="TE">TE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={week} onValueChange={setWeek}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
                <SelectItem value="5">Week 5</SelectItem>
                <SelectItem value="6">Week 6</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" onClick={() => void runAnalysis()} disabled={loading} className="min-h-[44px] inline-flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
              <span>Refresh Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Start/Sit Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Start/Sit Recommendations
          </CardTitle>
          <CardDescription>AI-powered advice for your toughest lineup decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-ios-subheadline">Loading roster and projections…</p>
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-ios-headline font-semibold mb-2 text-foreground">No roster or no projection data</h3>
              <p className="text-ios-subheadline max-w-md mx-auto">
                Connect your league and generate rankings so we can estimate weekly projections for your players.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {filteredDecisions.map((decision) => (
              <Card key={decision.playerId} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {getRecommendationIcon(decision.recommendation)}
                        <h3 className="text-lg font-semibold">{decision.name}</h3>
                        <Badge variant="outline">{decision.position}</Badge>
                        <Badge variant="outline">{decision.team}</Badge>
                        <span className="text-sm text-gray-500">{decision.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRecommendationColor(decision.recommendation)}>
                          {decision.recommendation.toUpperCase()}
                        </Badge>
                        {decision.injuryStatus && decision.injuryStatus !== "healthy" && (
                          <Badge variant="outline" className="text-orange-600">
                            {decision.injuryStatus}
                          </Badge>
                        )}
                        {decision.weatherConcern && (
                          <Badge variant="outline" className="text-blue-600">
                            Weather Watch
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{decision.projectedPoints.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">projected points</div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                      <p className="text-lg font-bold">{decision.confidence}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Matchup Grade</p>
                      <p className={`text-lg font-bold ${getGradeColor(decision.matchupGrade)}`}>
                        {decision.matchupGrade}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
                      <p className={`text-lg font-bold ${getRiskColor(decision.riskLevel)}`}>
                        {decision.riskLevel.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-medium mb-2">Analysis</h4>
                    <div className="space-y-1">
                      {decision.reasoning.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {filteredDecisions.filter((d) => d.recommendation === "start").length}
              </p>
              <p className="text-ios-subheadline text-text-secondary">Start Recommendations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {filteredDecisions.filter((d) => d.recommendation === "sit").length}
              </p>
              <p className="text-ios-subheadline text-text-secondary">Sit Recommendations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {filteredDecisions.filter((d) => d.recommendation === "flex").length}
              </p>
              <p className="text-ios-subheadline text-text-secondary">Flex Considerations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {filteredDecisions.length > 0 ? (filteredDecisions.reduce((sum, d) => sum + d.confidence, 0) / filteredDecisions.length).toFixed(0) : 0}%
              </p>
              <p className="text-ios-subheadline text-text-secondary">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
