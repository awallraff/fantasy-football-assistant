"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Trophy } from "lucide-react"
import { LeagueConnector } from "@/components/league-connector"
import { useSafeLocalStorage } from "@/hooks/use-local-storage"
import type { SleeperUser, SleeperLeague } from "@/lib/sleeper-api"

export default function HomePage() {
  console.log("[v0] HomePage rendering...")

  const router = useRouter()
  const { setItem, isClient } = useSafeLocalStorage()

  const handleLeaguesConnected = (user: SleeperUser, leagues: SleeperLeague[]) => {
    try {
      console.log("[v0] Leagues connected, saving data...")
      // Save to localStorage for dashboard access
      setItem("sleeper_user", JSON.stringify(user))
      setItem("sleeper_leagues", JSON.stringify(leagues))

      // Redirect to dashboard using Next.js router (prevents XSS, maintains React state)
      if (isClient) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error saving league data:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-ios-large-title font-bold text-foreground mb-4">Fantasy Football Analytics</h1>
          <p className="text-ios-headline text-text-secondary max-w-2xl mx-auto">
            Deep analytics for your Sleeper fantasy football teams. Import rankings, analyze trades, and get AI-powered
            recommendations.
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="max-w-md mx-auto mb-12">
          <LeagueConnector onLeaguesConnected={handleLeaguesConnected} />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-ios-headline font-semibold mb-2">Deep Analytics</h3>
              <p className="text-ios-subheadline text-text-secondary">Advanced metrics and performance insights for your teams</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-ios-headline font-semibold mb-2">Trade Analysis</h3>
              <p className="text-ios-subheadline text-text-secondary">Track opponent trade patterns and market trends</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-ios-headline font-semibold mb-2">Custom Rankings</h3>
              <p className="text-ios-subheadline text-text-secondary">Import and manage your own player ranking systems</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-ios-headline font-semibold mb-2">AI Recommendations</h3>
              <p className="text-ios-subheadline text-text-secondary">Smart trade and lineup suggestions based on league rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>Comprehensive fantasy football analytics powered by Sleeper API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-ios-body">
              <div className="space-y-2">
                <h4 className="text-ios-headline font-semibold">League Management</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Multi-league dashboard</li>
                  <li>• Real-time roster tracking</li>
                  <li>• Matchup analysis</li>
                  <li>• Transaction history</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-ios-headline font-semibold">Advanced Analytics</h4>
                <ul className="space-y-1 text-text-secondary">
                  <li>• Player performance trends</li>
                  <li>• Trade value calculations</li>
                  <li>• Lineup optimization</li>
                  <li>• Playoff projections</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
