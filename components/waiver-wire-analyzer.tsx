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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: Implement real waiver wire analysis using league data
    // This will fetch available players, analyze their opportunity, and provide recommendations
    setLoading(false)
    setTargets([])
  }, [league])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive"
      case "medium":
        return "bg-primary/10 text-primary"
      case "low":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      default:
        return "bg-background-elevated text-foreground"
    }
  }

  const getScheduleColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "good":
        return "bg-primary/10 text-primary"
      case "average":
        return "bg-primary/10 text-primary"
      case "poor":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-background-elevated text-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ios-title-3">
            <Target className="h-5 w-5 text-primary" />
            Waiver Wire Analyzer
          </CardTitle>
          <CardDescription className="text-ios-subheadline text-text-secondary">AI-powered analysis of the best available players to target</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-12 text-text-secondary text-ios-body">
              {loading ? "Analyzing waiver wire..." : "Waiver wire analysis will appear here when available"}
            </div>
          ) : (
            <div className="space-y-6">
              {targets.map((target) => (
                <Card key={target.playerId} className="border-l-4 border-l-primary bg-card shadow-md">
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-ios-title-3 text-foreground">{target.name}</h3>
                          <Badge variant="outline" className="text-ios-caption">{target.position}</Badge>
                          <Badge variant="outline" className="text-ios-caption">{target.team}</Badge>
                          {target.trendingUp && (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 text-ios-caption">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getPriorityColor(target.priority)} text-ios-caption`}>{target.priority} priority</Badge>
                          <Badge className={`${getScheduleColor(target.scheduleRating)} text-ios-caption`}>
                            {target.scheduleRating} schedule
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-ios-title-2 font-bold text-foreground">{target.ownership}%</div>
                        <div className="text-ios-footnote text-text-secondary">rostered</div>
                      </div>
                    </div>

                    {/* Projections */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-ios-title-2 font-bold text-foreground">{target.projectedPoints.toFixed(1)}</p>
                        <p className="text-ios-footnote text-text-secondary">Projected Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-ios-title-2 font-bold text-green-600 dark:text-green-400">{target.upside.toFixed(1)}</p>
                        <p className="text-ios-footnote text-text-secondary">Upside (90th %)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-ios-title-2 font-bold text-primary">${target.recommendedBid}</p>
                        <p className="text-ios-footnote text-text-secondary">Recommended Bid</p>
                      </div>
                    </div>

                    {/* Ownership Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-ios-subheadline mb-2 text-foreground">
                        <span>League Ownership</span>
                        <span>{target.ownership}%</span>
                      </div>
                      <Progress value={target.ownership} className="h-2" />
                    </div>

                    {/* Injury Opportunity */}
                    {target.injuryOpportunity && (
                      <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium text-ios-subheadline text-foreground">Injury Opportunity</span>
                        </div>
                        <p className="text-ios-caption text-text-secondary">
                          {target.injuryOpportunity.injuredPlayer} expected back{" "}
                          {target.injuryOpportunity.expectedReturn}
                        </p>
                      </div>
                    )}

                    {/* Reasoning */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-ios-subheadline text-foreground">
                        <Zap className="h-4 w-4 text-primary" />
                        Why Target This Player?
                      </h4>
                      <div className="space-y-2">
                        {target.reasoning.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-ios-caption">
                            <TrendingUp className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                            <span className="text-text-secondary">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1 min-h-[44px]">Add to Waiver Claims</Button>
                      <Button variant="outline" className="min-h-[44px]">View Player Details</Button>
                      <Button variant="outline" className="min-h-[44px]">Set Alert</Button>
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
        <Card className="bg-card shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-ios-title-2 font-bold text-foreground">{targets.filter((t) => t.priority === "high").length}</p>
              <p className="text-ios-footnote text-text-secondary">High Priority</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-ios-title-2 font-bold text-foreground">{targets.filter((t) => t.trendingUp).length}</p>
              <p className="text-ios-footnote text-text-secondary">Trending Up</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-ios-title-2 font-bold text-foreground">{targets.filter((t) => t.ownership < 25).length}</p>
              <p className="text-ios-footnote text-text-secondary">Low Owned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-ios-title-2 font-bold text-foreground">${targets.reduce((sum, t) => sum + t.recommendedBid, 0)}</p>
              <p className="text-ios-footnote text-text-secondary">Total Recommended</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
