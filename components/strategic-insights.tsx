"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, AlertTriangle, Target, Clock, Zap } from "lucide-react"
import type { SleeperLeague } from "@/lib/sleeper-api"

interface StrategicInsightsProps {
  league: SleeperLeague
  userId: string
}

interface Insight {
  id: string
  type: "opportunity" | "warning" | "trend" | "strategy"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  timeframe: "immediate" | "short_term" | "long_term"
  actionable: boolean
  confidence: number
  details: string[]
}

interface StrategicAnalysis {
  seasonOutlook: string
  playoffChances: number
  keyWeaknesses: string[]
  strengthAreas: string[]
  recommendedActions: string[]
  riskFactors: string[]
}

export function StrategicInsights({ league, userId }: StrategicInsightsProps) {
  // Mock strategic analysis - in real app, this would use AI/ML algorithms
  const insights: Insight[] = [
    {
      id: "1",
      type: "opportunity",
      title: "Buy Low on Injured Star",
      description: "Target Christian McCaffrey while owner is panicking about injury",
      impact: "high",
      timeframe: "immediate",
      actionable: true,
      confidence: 85,
      details: [
        "Owner has started 0-3 and needs immediate help",
        "CMC expected back Week 6 with full workload",
        "Historical data shows 40% discount during injury scares",
      ],
    },
    {
      id: "2",
      type: "warning",
      title: "Playoff Schedule Concern",
      description: "Your RB1 has brutal playoff matchups (Weeks 15-17)",
      impact: "high",
      timeframe: "long_term",
      actionable: true,
      confidence: 92,
      details: [
        "Faces #1, #3, and #2 run defenses in playoffs",
        "Consider trading for RB with easier schedule",
        "Handcuff becomes critical insurance",
      ],
    },
    {
      id: "3",
      type: "trend",
      title: "TE Market Inflation",
      description: "Tight end values rising 15% league-wide this week",
      impact: "medium",
      timeframe: "short_term",
      actionable: true,
      confidence: 78,
      details: [
        "3 major TE injuries created scarcity",
        "Your backup TE now worth WR2 value",
        "Window to sell high closes in 2-3 days",
      ],
    },
    {
      id: "4",
      type: "strategy",
      title: "Streaming Defense Strategy",
      description: "Optimal to stream defenses vs bottom 8 offenses",
      impact: "medium",
      timeframe: "long_term",
      actionable: true,
      confidence: 88,
      details: [
        "Bottom 8 teams average 12.3 fantasy points allowed to DST",
        "Streaming beats holding elite DST by 2.1 points/week",
        "Use roster spot for skill position depth instead",
      ],
    },
  ]

  const analysis: StrategicAnalysis = {
    seasonOutlook: "Strong playoff contender with balanced roster construction",
    playoffChances: 78,
    keyWeaknesses: ["Inconsistent WR2 production", "Lack of RB depth", "Bye week coverage"],
    strengthAreas: ["Elite QB play", "Strong TE position", "Favorable remaining schedule"],
    recommendedActions: [
      "Target consistent WR2 in trade",
      "Prioritize RB handcuffs on waivers",
      "Consider packaging QB in 2-for-1 deal",
    ],
    riskFactors: [
      "Heavy reliance on injury-prone RB1",
      "Tough playoff schedule for WR1",
      "Limited trade capital remaining",
    ],
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "trend":
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case "strategy":
        return <Target className="h-4 w-4 text-purple-500" />
    }
  }

  const getImpactColor = (impact: Insight["impact"]) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const getTimeframeIcon = (timeframe: Insight["timeframe"]) => {
    switch (timeframe) {
      case "immediate":
        return <Zap className="h-3 w-3" />
      case "short_term":
        return <Clock className="h-3 w-3" />
      case "long_term":
        return <Target className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Season Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Season Analysis</CardTitle>
          <CardDescription>AI-powered strategic assessment of your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">PLAYOFF CHANCES</h4>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">{analysis.playoffChances}%</div>
                <Badge variant="secondary">Strong Position</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">OUTLOOK</h4>
              <p className="text-sm">{analysis.seasonOutlook}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">KEY STRENGTHS</h4>
              <ul className="text-sm space-y-1">
                {analysis.strengthAreas.map((strength, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">AREAS TO IMPROVE</h4>
              <ul className="text-sm space-y-1">
                {analysis.keyWeaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Strategic Insights</h3>
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getImpactColor(insight.impact)}>{insight.impact} impact</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTimeframeIcon(insight.timeframe)}
                      {insight.timeframe.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence Level</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${insight.confidence}%` }} />
                      </div>
                      <span className="font-medium">{insight.confidence}%</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">Key Details:</h5>
                    <ul className="text-sm space-y-1">
                      {insight.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {insight.actionable && (
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        This insight requires immediate action. Consider implementing the recommended strategy.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Priority moves to improve your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Risk Assessment
          </CardTitle>
          <CardDescription>Potential challenges to monitor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                {risk}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
