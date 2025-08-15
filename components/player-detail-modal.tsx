"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Activity, Star } from "lucide-react"
import { usePlayerData } from "@/contexts/player-data-context"

interface PlayerDetailModalProps {
  player: {
    realPlayerName?: string
    realTeam?: string
    realPosition?: string
    injuryStatus?: string
    playerId?: string
    rank?: number
    tier?: number
    projectedPoints?: number
    adp?: number
    notes?: string
    playerName?: string
    position?: string
    team?: string
  }
  onClose: () => void
}

interface PlayerNews {
  title: string
  summary: string
  impact: "high" | "medium" | "low"
  timestamp: string
  source: string
}

interface PlayerStats {
  season: string
  gamesPlayed: number
  fantasyPoints: number
  avgPoints: number
  consistency: number
  trend: "up" | "down" | "stable"
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  const [playerNews, setPlayerNews] = useState<PlayerNews[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getPlayer, getPlayerName } = usePlayerData()

  const actualPlayer = player.playerId ? getPlayer(player.playerId) : null
  const displayName = actualPlayer
    ? actualPlayer.full_name || `${actualPlayer.first_name} ${actualPlayer.last_name}` || getPlayerName(player.playerId)
    : player.realPlayerName || player.playerName || "Unknown Player"
  const displayPosition = actualPlayer ? actualPlayer.position : player.realPosition || player.position || "UNKNOWN"
  const displayTeam = actualPlayer ? actualPlayer.team : player.realTeam || player.team || "FA"
  const displayInjuryStatus = actualPlayer ? actualPlayer.injury_status : player.injuryStatus || "Healthy"

  useEffect(() => {
    loadPlayerData()
  }, [player.playerId, displayName])

  const loadPlayerData = async () => {
    setIsLoading(true)
    try {
      const uniqueNews = await generatePlayerSpecificNews(displayName, displayPosition, displayTeam)
      setPlayerNews(uniqueNews)

      const mockStats: PlayerStats[] = [
        {
          season: "2024",
          gamesPlayed: 12,
          fantasyPoints: player.projectedPoints ? player.projectedPoints * 12 : getPositionBasedPoints(displayPosition),
          avgPoints: player.projectedPoints || getPositionBasedAverage(displayPosition),
          consistency: Math.floor(Math.random() * 30) + 70,
          trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
        },
        {
          season: "2023",
          gamesPlayed: 17,
          fantasyPoints: getPositionBasedPoints(displayPosition, true),
          avgPoints: getPositionBasedAverage(displayPosition, true),
          consistency: Math.floor(Math.random() * 25) + 65,
          trend: "stable",
        },
      ]

      setPlayerStats(mockStats)
    } catch (error) {
      console.error("Error loading player data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePlayerSpecificNews = async (
    playerName: string,
    position: string,
    team: string,
  ): Promise<PlayerNews[]> => {
    const newsTemplates = [
      {
        title: `${playerName} Shows Strong Performance`,
        summary: `${playerName} has been a consistent performer for ${team}, showing reliability in the ${position} position with solid fantasy production.`,
        impact: "medium" as const,
        source: "Fantasy Analysis",
      },
      {
        title: `${team} Offensive Outlook`,
        summary: `The ${team} offense has been creating opportunities for ${playerName}, making him a viable option in the ${position} position for fantasy lineups.`,
        impact: "low" as const,
        source: "Team Analysis",
      },
      {
        title: `${position} Position Update`,
        summary:
          displayInjuryStatus !== "Healthy"
            ? `${playerName} is currently listed as ${displayInjuryStatus}. Fantasy managers should monitor his status closely.`
            : `${playerName} is healthy and expected to maintain his role in ${team}'s offense.`,
        impact: displayInjuryStatus !== "Healthy" ? ("high" as const) : ("low" as const),
        source: "Injury Report",
      },
    ]

    // Add position-specific news
    if (position === "QB") {
      newsTemplates.push({
        title: `Quarterback Analysis: ${playerName}`,
        summary: `${playerName} has shown good decision-making and arm strength, making him a solid fantasy quarterback option for ${team}.`,
        impact: "medium" as const,
        source: "QB Analysis",
      })
    } else if (position === "RB") {
      newsTemplates.push({
        title: `Backfield Report: ${playerName}`,
        summary: `${playerName} has been getting consistent touches in ${team}'s backfield, providing reliable fantasy production.`,
        impact: "medium" as const,
        source: "Backfield Report",
      })
    } else if (position === "WR") {
      newsTemplates.push({
        title: `Receiver Update: ${playerName}`,
        summary: `${playerName} has been a target in ${team}'s passing game, showing potential for fantasy relevance.`,
        impact: "medium" as const,
        source: "Receiver Report",
      })
    } else if (position === "TE") {
      newsTemplates.push({
        title: `Tight End Focus: ${playerName}`,
        summary: `${playerName} has been utilized in ${team}'s offense, providing value in the tight end position.`,
        impact: "medium" as const,
        source: "TE Analysis",
      })
    }

    return newsTemplates.map((template, index) => ({
      ...template,
      timestamp: `${index + 1} ${index === 0 ? "hour" : "day"}${index === 0 ? "" : "s"} ago`,
    }))
  }

  const getPositionBasedPoints = (position: string, isPreviousYear = false): number => {
    const basePoints = {
      QB: isPreviousYear ? 280 : 320,
      RB: isPreviousYear ? 220 : 250,
      WR: isPreviousYear ? 200 : 230,
      TE: isPreviousYear ? 150 : 170,
      K: isPreviousYear ? 110 : 120,
      DEF: isPreviousYear ? 130 : 140,
    }
    return basePoints[position as keyof typeof basePoints] || 180
  }

  const getPositionBasedAverage = (position: string, isPreviousYear = false): number => {
    const avgPoints = {
      QB: isPreviousYear ? 16.5 : 18.8,
      RB: isPreviousYear ? 12.9 : 14.7,
      WR: isPreviousYear ? 11.8 : 13.5,
      TE: isPreviousYear ? 8.8 : 10.0,
      K: isPreviousYear ? 6.5 : 7.1,
      DEF: isPreviousYear ? 7.6 : 8.2,
    }
    return avgPoints[position as keyof typeof avgPoints] || 10.5
  }

  const getInjuryBadgeColor = (status?: string) => {
    if (!status || status === "Healthy") return "default"
    if (status === "Questionable") return "secondary"
    if (status === "Doubtful") return "destructive"
    if (status === "Out") return "destructive"
    return "secondary"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
              {player.rank || "?"}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{displayPosition}</span>
                <span>•</span>
                <span>{displayTeam}</span>
                {displayInjuryStatus && displayInjuryStatus !== "Healthy" && (
                  <>
                    <span>•</span>
                    <Badge variant={getInjuryBadgeColor(displayInjuryStatus)}>{displayInjuryStatus}</Badge>
                  </>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{player.projectedPoints?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-gray-600">Projected Points</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{player.adp?.toFixed(1) || "N/A"}</p>
                <p className="text-sm text-gray-600">Average Draft Position</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{player.tier || "N/A"}</p>
                <p className="text-sm text-gray-600">Tier Ranking</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Fantasy Outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fantasy Relevance</span>
                    <Badge variant="outline">
                      {player.rank && player.rank <= 50 ? "High" : player.rank && player.rank <= 100 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Position Rank</span>
                    <span className="text-sm">#{player.rank || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Injury Risk</span>
                    <Badge
                      variant={displayInjuryStatus && displayInjuryStatus !== "Healthy" ? "destructive" : "default"}
                    >
                      {displayInjuryStatus && displayInjuryStatus !== "Healthy" ? "High" : "Low"}
                    </Badge>
                  </div>
                  {player.notes && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm">{player.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {playerStats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{stat.season} Season</span>
                        {getTrendIcon(stat.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{stat.gamesPlayed}</p>
                          <p className="text-xs text-gray-600">Games Played</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{stat.fantasyPoints}</p>
                          <p className="text-xs text-gray-600">Total Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{stat.avgPoints.toFixed(1)}</p>
                          <p className="text-xs text-gray-600">Avg Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{stat.consistency}%</p>
                          <p className="text-xs text-gray-600">Consistency</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {playerNews.map((news, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            news.impact === "high"
                              ? "bg-red-500"
                              : news.impact === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{news.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={getImpactColor(news.impact)}>{news.impact} impact</Badge>
                              <span className="text-xs text-gray-500">{news.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                          <p className="text-xs text-gray-500">Source: {news.source}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ranking Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Rank</span>
                    <span className="text-sm font-bold">#{player.rank || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Position Rank</span>
                    <span className="text-sm">
                      #{player.rank || "N/A"} {displayPosition}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tier</span>
                    <span className="text-sm">Tier {player.tier || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ADP</span>
                    <span className="text-sm">{player.adp?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
