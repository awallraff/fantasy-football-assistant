"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Zap, Clock } from "lucide-react"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface WaiverWireAnalyzerProps {
  league: SleeperLeague
}

interface WaiverTarget {
  playerId: string
  name: string
  position: string
  team: string
  ownership: number
  projectedPoints: number
  upside: number
  priority: "high" | "medium" | "low"
  reasoning: string[]
  rosterPercentage: number
  trendingUp: boolean
  injuryOpportunity?: {
    injuredPlayer: string
    expectedReturn: string
  }
  scheduleRating: "excellent" | "good" | "average" | "poor"
  recommendedBid: number
}

export function WaiverWireAnalyzer({ league }: WaiverWireAnalyzerProps) {
  const [targets, setTargets] = useState<WaiverTarget[]>([])
  const [loading] = useState(false)

  // Mock waiver targets
  useEffect(() => {
    const mockTargets: WaiverTarget[] = [
      {
        playerId: "1",
        name: "Roschon Johnson",
        position: "RB",
        team: "CHI",
        ownership: 23,
        projectedPoints: 12.5,
        upside: 18.2,
        priority: "high",
        reasoning: [
          "Lead back role with D'Onta Foreman injured",
          "Favorable upcoming schedule vs weak run defenses",
          "Red zone opportunities increasing",
          "Low ownership despite opportunity",
        ],
        rosterPercentage: 23,
        trendingUp: true,
        injuryOpportunity: {
          injuredPlayer: "D'Onta Foreman",
          expectedReturn: "Week 8",
        },
        scheduleRating: "excellent",
        recommendedBid: 15,
      },
      {
        playerId: "2",
        name: "Demario Douglas",
        position: "WR",
        team: "NE",
        ownership: 8,
        projectedPoints: 9.8,
        upside: 15.5,
        priority: "medium",
        reasoning: [
          "Slot receiver with consistent targets",
          "Patriots passing game improving",
          "Low ownership, high target share",
          "Bye week fill-in with upside",
        ],
        rosterPercentage: 8,
        trendingUp: true,
        scheduleRating: "good",
        recommendedBid: 8,
      },
      {
        playerId: "3",
        name: "Tyler Boyd",
        position: "WR",
        team: "CIN",
        ownership: 45,
        projectedPoints: 11.2,
        upside: 16.8,
        priority: "medium",
        reasoning: [
          "Tee Higgins dealing with injury concerns",
          "Reliable target in Bengals offense",
          "Playoff schedule very favorable",
          "Proven veteran with safe floor",
        ],
        rosterPercentage: 45,
        trendingUp: false,
        scheduleRating: "excellent",
        recommendedBid: 12,
      },
      {
        playerId: "4",
        name: "Jordan Mason",
        position: "RB",
        team: "SF",
        ownership: 67,
        projectedPoints: 8.5,
        upside: 20.1,
        priority: "low",
        reasoning: [
          "Handcuff to Christian McCaffrey",
          "Proven production when given opportunity",
          "49ers rushing offense elite",
          "Insurance policy for CMC owners",
        ],
        rosterPercentage: 67,
        trendingUp: false,
        scheduleRating: "good",
        recommendedBid: 5,
      },
    ]

    setTargets(mockTargets)
  }, [league])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getScheduleColor = (rating: string) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Waiver Wire Analyzer
          </CardTitle>
          <CardDescription>AI-powered analysis of the best available players to target</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? "Analyzing waiver wire..." : "No waiver targets available"}
            </div>
          ) : (
            <div className="space-y-6">
              {targets.map((target) => (
                <Card key={target.playerId} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{target.name}</h3>
                          <Badge variant="outline">{target.position}</Badge>
                          <Badge variant="outline">{target.team}</Badge>
                          {target.trendingUp && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(target.priority)}>{target.priority} priority</Badge>
                          <Badge className={getScheduleColor(target.scheduleRating)}>
                            {target.scheduleRating} schedule
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{target.ownership}%</div>
                        <div className="text-sm text-gray-500">rostered</div>
                      </div>
                    </div>

                    {/* Projections */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-xl font-bold">{target.projectedPoints.toFixed(1)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Projected Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{target.upside.toFixed(1)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Upside (90th %)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">${target.recommendedBid}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Recommended Bid</p>
                      </div>
                    </div>

                    {/* Ownership Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>League Ownership</span>
                        <span>{target.ownership}%</span>
                      </div>
                      <Progress value={target.ownership} className="h-2" />
                    </div>

                    {/* Injury Opportunity */}
                    {target.injuryOpportunity && (
                      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">Injury Opportunity</span>
                        </div>
                        <p className="text-sm">
                          {target.injuryOpportunity.injuredPlayer} expected back{" "}
                          {target.injuryOpportunity.expectedReturn}
                        </p>
                      </div>
                    )}

                    {/* Reasoning */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Why Target This Player?
                      </h4>
                      <div className="space-y-2">
                        {target.reasoning.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <TrendingUp className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1">Add to Waiver Claims</Button>
                      <Button variant="outline">View Player Details</Button>
                      <Button variant="outline">Set Alert</Button>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{targets.filter((t) => t.priority === "high").length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{targets.filter((t) => t.trendingUp).length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Trending Up</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{targets.filter((t) => t.ownership < 25).length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Owned</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${targets.reduce((sum, t) => sum + t.recommendedBid, 0)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recommended</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
