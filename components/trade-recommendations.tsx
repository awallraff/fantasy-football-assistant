"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRightLeft, TrendingUp, Target, Brain, Loader2 } from "lucide-react"
import { sleeperAPI, type SleeperLeague, type SleeperRoster, type SleeperUser } from "@/lib/sleeper-api"
import type { TradeRecommendation } from "@/types/trade-recommendation"

interface TradeRecommendationsProps {
  league: SleeperLeague
  userId: string
  season: string
}

export function TradeRecommendations({ league, userId }: TradeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TradeRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [rosters, setRosters] = useState<SleeperRoster[]>([])

  const generateLeagueSpecificRecommendations = useCallback(async (
    league: SleeperLeague,
    userRoster: SleeperRoster,
    allRosters: SleeperRoster[],
    allUsers: SleeperUser[],
  ): Promise<TradeRecommendation[]> => {
    const recommendations: TradeRecommendation[] = []

    // Analyze each opponent roster for trade opportunities
    for (const roster of allRosters) {
      if (roster.owner_id === userId) continue // Skip user's own roster

      const opponent = allUsers.find((u) => u.user_id === roster.owner_id)
      if (!opponent) continue

      // Analyze roster construction and needs
      const userNeeds = analyzeRosterNeeds(userRoster, league.roster_positions)
      const opponentNeeds = analyzeRosterNeeds(roster, league.roster_positions)

      // Find complementary needs
      const tradeOpportunity = findTradeOpportunity(userRoster, roster, userNeeds, opponentNeeds)

      if (tradeOpportunity) {
        recommendations.push({
          id: `trade_${roster.roster_id}`,
          targetTeam: `Team ${roster.roster_id}`,
          targetOwner: opponent.display_name || opponent.username || `Owner ${opponent.user_id}`,
          confidence: tradeOpportunity.confidence,
          projectedGain: tradeOpportunity.projectedGain,
          reasoning: tradeOpportunity.reasoning,
          yourPlayers: tradeOpportunity.yourPlayers,
          theirPlayers: tradeOpportunity.theirPlayers,
          tradeType: tradeOpportunity.tradeType,
          urgency: tradeOpportunity.urgency,
          successProbability: tradeOpportunity.successProbability,
        })
      }
    }

    // Sort by confidence and return top recommendations
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }, [userId])

  useEffect(() => {
    const fetchLeagueData = async () => {
      setLoading(true)
      try {
        // Fetch league rosters and users
        const [leagueRosters, leagueUsers] = await Promise.all([
          sleeperAPI.getLeagueRosters(league.league_id),
          sleeperAPI.getLeagueUsers(league.league_id),
        ])

        setRosters(leagueRosters)

        // Find user's roster
        const userRoster = leagueRosters.find((roster) => roster.owner_id === userId)
        if (!userRoster) {
          setRecommendations([])
          return
        }

        // Generate league-specific recommendations based on real data
        const leagueSpecificRecs = await generateLeagueSpecificRecommendations(
          league,
          userRoster,
          leagueRosters,
          leagueUsers,
        )

        setRecommendations(leagueSpecificRecs)
      } catch (error) {
        console.error("Error fetching league data:", error)
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeagueData()
  }, [league, userId, generateLeagueSpecificRecommendations])

  const analyzeRosterNeeds = (roster: SleeperRoster, rosterPositions: string[]) => {
    const positionCounts = rosterPositions.reduce(
      (acc, pos) => {
        acc[pos] = (acc[pos] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // This would ideally use player data to determine actual needs
    // For now, return mock analysis based on roster structure
    return {
      needsRB: positionCounts["RB"] > 0,
      needsWR: positionCounts["WR"] > 0,
      needsQB: positionCounts["QB"] > 0,
      needsTE: positionCounts["TE"] > 0,
      hasExcessRB: roster.players?.length > 15,
      hasExcessWR: roster.players?.length > 15,
    }
  }

  const findTradeOpportunity = (
    _userRoster: SleeperRoster,
    _opponentRoster: SleeperRoster,
    _userNeeds: Record<string, boolean>,
    _opponentNeeds: Record<string, boolean>,
  ): {
    confidence: number
    projectedGain: number
    reasoning: string[]
    yourPlayers: Array<{ name: string; position: string; currentValue: number; projectedValue: number }>
    theirPlayers: Array<{ name: string; position: string; currentValue: number; projectedValue: number }>
    tradeType: "buy_low" | "sell_high" | "positional_need" | "value_play"
    urgency: "high" | "medium" | "low"
    successProbability: number
  } | null => {
    // TODO: Implement real trade opportunity analysis using:
    // - Player values from rankings
    // - Recent performance data
    // - Injury status
    // - Matchup schedules
    // - League scoring settings

    // For now, return null (no recommendations) until proper implementation
    return null
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "buy_low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "sell_high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "positional_need":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "value_play":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "buy_low":
        return "Buy Low"
      case "sell_high":
        return "Sell High"
      case "positional_need":
        return "Positional Need"
      case "value_play":
        return "Value Play"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Trade Recommendations
          </CardTitle>
          <CardDescription>
            Smart trade suggestions for {league.name} (2025 season) based on real roster analysis and league
            settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-text-secondary text-ios-body">Analyzing {league.name} rosters and generating recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-ios-headline font-semibold mb-2">Trade Recommendations Coming Soon</p>
              <p className="text-ios-subheadline">
                AI-powered trade analysis is currently in development. Check back soon for personalized recommendations
                based on your league&apos;s rosters and scoring settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-background-elevated p-4 rounded-lg border border-border/50">
                <h4 className="font-semibold mb-2 text-ios-headline">League Context: {league.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-ios-subheadline">
                  <div>
                    <span className="text-text-secondary">Season:</span>
                    <span className="ml-2 font-medium text-foreground">2025</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Teams:</span>
                    <span className="ml-2 font-medium text-foreground">{league.total_rosters}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Format:</span>
                    <span className="ml-2 font-medium text-foreground">{league.settings.num_teams}-team</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Rosters:</span>
                    <span className="ml-2 font-medium text-foreground">{rosters.length} active</span>
                  </div>
                </div>
              </div>

              {recommendations.map((rec) => (
                <Card key={rec.id} className="border-l-4 border-l-primary bg-background-elevated">
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-ios-title-3 font-semibold mb-2">Trade with {rec.targetOwner}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(rec.tradeType)}>{getTypeLabel(rec.tradeType)}</Badge>
                          <Badge variant="outline" className={getUrgencyColor(rec.urgency)}>
                            {rec.urgency} urgency
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">+{rec.projectedGain.toFixed(1)}</div>
                        <div className="text-ios-caption text-text-secondary">projected points/week</div>
                      </div>
                    </div>

                    {/* Confidence Metrics */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>AI Confidence</span>
                          <span>{rec.confidence.toFixed(0)}%</span>
                        </div>
                        <Progress value={rec.confidence} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Success Probability</span>
                          <span>{rec.successProbability.toFixed(0)}%</span>
                        </div>
                        <Progress value={rec.successProbability} className="h-2" />
                      </div>
                    </div>

                    {/* Trade Details */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4" />
                          You Give
                        </h4>
                        <div className="space-y-2">
                          {rec.yourPlayers.map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded"
                            >
                              <div>
                                <span className="font-medium">{player.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {player.position}
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div>Value: {player.currentValue}</div>
                                <div className="text-gray-500">→ {player.projectedValue}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          You Get
                        </h4>
                        <div className="space-y-2">
                          {rec.theirPlayers.map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded"
                            >
                              <div>
                                <span className="font-medium">{player.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {player.position}
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div>Value: {player.currentValue}</div>
                                <div className="text-gray-500">→ {player.projectedValue}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Analysis
                      </h4>
                      <div className="space-y-2">
                        {rec.reasoning.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <TrendingUp className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1">Propose Trade</Button>
                      <Button variant="outline">View Details</Button>
                      <Button variant="outline">Dismiss</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{recommendations.length}</p>
              <p className="text-ios-subheadline text-text-secondary">Active Recommendations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {recommendations.reduce((sum, rec) => sum + rec.projectedGain, 0).toFixed(1)}
              </p>
              <p className="text-ios-subheadline text-text-secondary">Total Projected Gain</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {recommendations.length > 0
                  ? (recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-ios-subheadline text-text-secondary">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
