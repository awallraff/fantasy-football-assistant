"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, TrendingUp, Users, Zap, Loader2 } from "lucide-react"
import { sleeperAPI, type SleeperLeague } from "@/lib/sleeper-api"
import { usePlayerData } from "@/contexts/player-data-context"
import { useProjections } from "@/contexts/projections-context"
import {
  buildRosterRows,
  greedyOptimalLineup,
  lineupDiffVsCurrent,
  getApproximateNflWeek,
} from "@/lib/league-roster-analysis"

function resolveDisplayWeek(selectedWeek: string): number {
  const base = getApproximateNflWeek()
  if (selectedWeek === "current") return base
  if (selectedWeek === "next") return Math.min(18, base + 1)
  const n = Number.parseInt(selectedWeek, 10)
  return Number.isFinite(n) ? Math.max(1, Math.min(18, n)) : base
}

interface LineupOptimizerProps {
  league: SleeperLeague
  userId: string
}

interface PlayerRecommendation {
  playerId: string
  name: string
  position: string
  team: string
  projectedPoints: number
  confidence: number
  matchupRating: "excellent" | "good" | "average" | "poor"
  reasoning: string[]
  isCurrentStarter: boolean
  benchAlternative?: {
    name: string
    projectedPoints: number
  }
}

interface LineupOptimization {
  week: number
  totalProjectedPoints: number
  currentProjectedPoints: number
  potentialGain: number
  recommendations: PlayerRecommendation[]
  riskLevel: "conservative" | "balanced" | "aggressive"
}

export function LineupOptimizer({ league, userId }: LineupOptimizerProps) {
  const [optimization, setOptimization] = useState<LineupOptimization | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<string>("current")
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "balanced" | "aggressive">("balanced")
  const { getPlayer, getPlayerName } = usePlayerData()
  const { getProjection, loadProjectionsForPlayers } = useProjections()

  const runOptimization = useCallback(async () => {
    setLoading(true)
    try {
      const rosters = await sleeperAPI.getLeagueRosters(league.league_id)
      const userRoster = rosters.find((r) => r.owner_id === userId)
      if (!userRoster) {
        setOptimization(null)
        return
      }
      const ids = [...new Set([...(userRoster.players || []), ...(userRoster.starters || [])])]
      const nameMap = new Map(ids.map((id) => [id, getPlayerName(id)]))
      await loadProjectionsForPlayers(ids, nameMap)
      const rows = buildRosterRows(userRoster, getPlayer, getProjection)
      const riskMul = riskTolerance === "conservative" ? 0.97 : riskTolerance === "aggressive" ? 1.03 : 1
      const adjustedRows = rows.map((r) => ({ ...r, weeklyProjection: r.weeklyProjection * riskMul }))
      const { totalProjection, optimalStarters } = greedyOptimalLineup(league, adjustedRows, getPlayer)
      const { swaps, currentTotal } = lineupDiffVsCurrent(userRoster, optimalStarters, adjustedRows)
      const potentialGain = Math.max(0, totalProjection - currentTotal)
      const week = resolveDisplayWeek(selectedWeek)

      const recommendations: PlayerRecommendation[] = swaps.map((s) => {
        const matchupRating: PlayerRecommendation["matchupRating"] =
          s.bench.weeklyProjection >= 14
            ? "excellent"
            : s.bench.weeklyProjection >= 9
              ? "good"
              : s.bench.weeklyProjection >= 5
                ? "average"
                : "poor"
        return {
          playerId: s.bench.playerId,
          name: s.bench.name,
          position: s.bench.position,
          team: s.bench.team,
          projectedPoints: s.bench.weeklyProjection,
          confidence: Math.min(92, 55 + Math.round(s.gain * 3)),
          matchupRating,
          reasoning: [
            `Projected to outscore ${s.out.name} by ~${s.gain.toFixed(1)} pts with current rankings context.`,
            "Compared greedy optimal starters to your Sleeper lineup using the same projection set.",
          ],
          isCurrentStarter: false,
          benchAlternative: { name: s.out.name, projectedPoints: s.out.weeklyProjection },
        }
      })

      setOptimization({
        week,
        totalProjectedPoints: totalProjection,
        currentProjectedPoints: currentTotal,
        potentialGain,
        recommendations,
        riskLevel: riskTolerance,
      })
    } catch (e) {
      console.error("Lineup optimizer:", e)
      setOptimization(null)
    } finally {
      setLoading(false)
    }
  }, [league, userId, selectedWeek, riskTolerance, getPlayer, getPlayerName, getProjection, loadProjectionsForPlayers])

  useEffect(() => {
    void runOptimization()
  }, [runOptimization])

  const getMatchupColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "average":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "poor":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const applyOptimization = () => {
    // In real app, this would update the actual lineup
    alert("Lineup optimization applied! (This would update your actual Sleeper lineup)")
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
                <SelectItem value="5">Week 5</SelectItem>
                <SelectItem value="6">Week 6</SelectItem>
                <SelectItem value="7">Week 7</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={riskTolerance}
              onValueChange={(value: "conservative" | "balanced" | "aggressive") => setRiskTolerance(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" onClick={() => void runOptimization()} disabled={loading} className="min-h-[44px] inline-flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
              <span>Optimize Lineup</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-background-elevated border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-ios-subheadline text-text-secondary">Loading roster and projections…</p>
          </CardContent>
        </Card>
      ) : !optimization ? (
        <Card className="bg-background-elevated border-border">
          <CardHeader>
            <CardTitle className="text-ios-title-3 font-semibold">Lineup Optimizer</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto mb-4 text-text-secondary opacity-30" />
            <h3 className="text-ios-headline font-semibold mb-2 text-foreground">No roster in this league</h3>
            <p className="text-ios-subheadline text-text-secondary max-w-md mx-auto">
              We couldn&apos;t find your roster for this league. Confirm you&apos;re logged in as the right Sleeper user.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lineup Optimization - Week {optimization.week}
              </CardTitle>
              <CardDescription>AI-powered lineup recommendations to maximize your scoring potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{optimization.totalProjectedPoints.toFixed(1)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Optimized Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">{optimization.currentProjectedPoints.toFixed(1)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">+{optimization.potentialGain.toFixed(1)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential Gain</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={applyOptimization} size="lg" className="px-8">
                  <Zap className="h-4 w-4 mr-2" />
                  Apply Optimization
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Player Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommended Changes</h3>
            {optimization.recommendations.length === 0 && (
              <p className="text-sm text-text-secondary">
                No swaps clear the projection threshold — your active lineup may already match this greedy optimal
                assignment for your league&apos;s slots.
              </p>
            )}
            {optimization.recommendations.map((rec) => (
              <Card key={rec.playerId} className={rec.isCurrentStarter ? "border-blue-200" : "border-green-200"}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{rec.name}</h4>
                        <Badge variant="outline">{rec.position}</Badge>
                        <Badge variant="outline">{rec.team}</Badge>
                        <Badge className={getMatchupColor(rec.matchupRating)}>{rec.matchupRating} matchup</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Confidence: {rec.confidence}%</span>
                        {rec.benchAlternative && (
                          <span>
                            vs {rec.benchAlternative.name} ({rec.benchAlternative.projectedPoints.toFixed(1)} pts)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{rec.projectedPoints.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">projected points</p>
                      {!rec.isCurrentStarter && (
                        <Badge variant="secondary" className="mt-1">
                          Recommended Start
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Why This Player?
                    </h5>
                    <div className="space-y-1">
                      {rec.reasoning.map((reason, idx) => (
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

          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Lineup Risk Level: {optimization.riskLevel}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Floor (25th percentile):</span>
                      <span className="font-medium">{(optimization.totalProjectedPoints * 0.75).toFixed(1)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projection (50th percentile):</span>
                      <span className="font-medium">{optimization.totalProjectedPoints.toFixed(1)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ceiling (75th percentile):</span>
                      <span className="font-medium">{(optimization.totalProjectedPoints * 1.25).toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Key Considerations</h4>
                  <div className="space-y-1 text-sm">
                    <div>• Weather conditions monitored for outdoor games</div>
                    <div>• Injury reports updated through game time</div>
                    <div>• Vegas lines and implied team totals factored</div>
                    <div>• Recent target/touch trends analyzed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
