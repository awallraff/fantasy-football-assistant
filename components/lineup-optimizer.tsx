"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, TrendingUp, Users, Zap } from "lucide-react"
import type { SleeperLeague } from "@/lib/sleeper-api"

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
  const [selectedWeek, setSelectedWeek] = useState<string>("current")
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "balanced" | "aggressive">("balanced")

  // TODO: Implement real lineup optimization using:
  // - Player projections from rankings
  // - Bench depth analysis
  // - Matchup ratings
  // - Injury status and practice reports
  // - Vegas lines and game environments
  useEffect(() => {
    // For now, show empty state until implementation is complete
    setOptimization(null)
  }, [league, userId, selectedWeek, riskTolerance])

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

            <Button>Optimize Lineup</Button>
          </div>
        </CardContent>
      </Card>

      {!optimization ? (
        <Card className="bg-background-elevated border-border">
          <CardHeader>
            <CardTitle className="text-ios-title-3 font-semibold">Lineup Optimizer</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto mb-4 text-text-secondary opacity-30" />
            <h3 className="text-ios-headline font-semibold mb-2 text-foreground">Lineup Optimization Coming Soon</h3>
            <p className="text-ios-subheadline text-text-secondary max-w-md mx-auto">
              AI-powered lineup optimization will analyze your roster, bench depth, and matchups to maximize your projected points each week.
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
