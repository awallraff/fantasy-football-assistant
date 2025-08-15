import { sleeperAPI, type SleeperPlayer } from "./sleeper-api"

export interface PlayerNews {
  id: string
  player_id: string
  title: string
  content: string
  source: string
  published_date: string
  impact_level: "low" | "medium" | "high"
  tags: string[]
}

export interface PlayerStats {
  player_id: string
  week: number
  points: number
  projected_points?: number
  games_played: number
  season_points: number
  avg_points: number
  position_rank?: number
}

export interface EnhancedPlayer extends SleeperPlayer {
  current_news: PlayerNews[]
  recent_stats: PlayerStats[]
  injury_impact: "none" | "questionable" | "doubtful" | "out"
  trend: "up" | "down" | "stable"
  trade_value: number
  fantasy_outlook: string
}

class PlayerService {
  private playersCache: { [player_id: string]: SleeperPlayer } = {}
  private newsCacheExpiry = 30 * 60 * 1000 // 30 minutes
  private newsCache: { [player_id: string]: { news: PlayerNews[]; timestamp: number } } = {}

  async getAllPlayers(): Promise<{ [player_id: string]: SleeperPlayer }> {
    if (Object.keys(this.playersCache).length === 0) {
      this.playersCache = await sleeperAPI.getAllPlayers()
    }
    return this.playersCache
  }

  async getPlayer(playerId: string): Promise<SleeperPlayer | null> {
    const players = await this.getAllPlayers()
    return players[playerId] || null
  }

  async getPlayersForRoster(playerIds: string[]): Promise<SleeperPlayer[]> {
    const players = await this.getAllPlayers()
    return playerIds.map((id) => players[id]).filter(Boolean)
  }

  async getPlayerStats(playerId: string, leagueId: string, weeks: number[] = []): Promise<PlayerStats[]> {
    try {
      const stats: PlayerStats[] = []

      // Get matchup data for specified weeks or current week
      const weeksToCheck = weeks.length > 0 ? weeks : [this.getCurrentWeek()]

      for (const week of weeksToCheck) {
        const matchups = await sleeperAPI.getMatchups(leagueId, week)

        for (const matchup of matchups) {
          if (matchup.players_points && matchup.players_points[playerId]) {
            stats.push({
              player_id: playerId,
              week,
              points: matchup.players_points[playerId],
              games_played: 1,
              season_points: matchup.players_points[playerId],
              avg_points: matchup.players_points[playerId],
            })
          }
        }
      }

      return stats
    } catch (error) {
      console.error("Error fetching player stats:", error)
      return []
    }
  }

  async getPlayerNews(playerId: string): Promise<PlayerNews[]> {
    // Check cache first
    const cached = this.newsCache[playerId]
    if (cached && Date.now() - cached.timestamp < this.newsCacheExpiry) {
      return cached.news
    }

    try {
      // In production, this would integrate with SportsDataIO, RotoBaller, or RapidAPI
      const player = await this.getPlayer(playerId)
      if (!player) return []

      // Return empty news array - real news integration would go here
      const news: PlayerNews[] = []

      // Cache the results
      this.newsCache[playerId] = {
        news,
        timestamp: Date.now(),
      }

      return news
    } catch (error) {
      console.error("Error fetching player news:", error)
      return []
    }
  }

  async getEnhancedPlayer(playerId: string, leagueId?: string): Promise<EnhancedPlayer | null> {
    const player = await this.getPlayer(playerId)
    if (!player) return null

    const news = await this.getPlayerNews(playerId)
    const stats = leagueId ? await this.getPlayerStats(playerId, leagueId) : []

    // Calculate trade value based on position, team, injury status, and recent news
    const tradeValue = this.calculateTradeValue(player, news, stats)
    const trend = this.calculateTrend(news, stats)
    const injuryImpact = this.getInjuryImpact(player, news)

    return {
      ...player,
      current_news: news,
      recent_stats: stats,
      injury_impact: injuryImpact,
      trend,
      trade_value: tradeValue,
      fantasy_outlook: this.generateFantasyOutlook(player, news, stats, trend),
    }
  }

  private calculateTradeValue(player: SleeperPlayer, news: PlayerNews[], stats: PlayerStats[]): number {
    let baseValue = 50 // Base value out of 100

    // Position multipliers
    const positionValues = {
      QB: 1.2,
      RB: 1.4,
      WR: 1.3,
      TE: 1.1,
      K: 0.6,
      DEF: 0.7,
    }

    baseValue *= positionValues[player.position as keyof typeof positionValues] || 1.0

    // Age factor
    if (player.age) {
      if (player.age < 25) baseValue *= 1.1
      else if (player.age > 30) baseValue *= 0.9
    }

    // Injury impact
    if (player.injury_status) {
      const injuryMultipliers = {
        Questionable: 0.95,
        Doubtful: 0.8,
        Out: 0.6,
        IR: 0.3,
      }
      baseValue *= injuryMultipliers[player.injury_status as keyof typeof injuryMultipliers] || 0.9
    }

    // News impact
    const highImpactNews = news.filter((n) => n.impact_level === "high").length
    if (highImpactNews > 0) {
      baseValue *= 1.1 // Positive news impact
    }

    // Recent performance
    if (stats.length > 0) {
      const avgPoints = stats.reduce((sum, s) => sum + s.points, 0) / stats.length
      if (avgPoints > 15) baseValue *= 1.2
      else if (avgPoints < 5) baseValue *= 0.8
    }

    return Math.min(100, Math.max(0, Math.round(baseValue)))
  }

  private calculateTrend(news: PlayerNews[], stats: PlayerStats[]): "up" | "down" | "stable" {
    // Analyze recent news sentiment
    const recentNews = news.filter((n) => Date.now() - new Date(n.published_date).getTime() < 7 * 24 * 60 * 60 * 1000)

    const positiveKeywords = ["expected", "healthy", "strong", "improved", "breakout"]
    const negativeKeywords = ["injury", "questionable", "limited", "concern", "struggling"]

    let sentiment = 0
    recentNews.forEach((article) => {
      const content = article.title.toLowerCase() + " " + article.content.toLowerCase()
      positiveKeywords.forEach((word) => {
        if (content.includes(word)) sentiment += 1
      })
      negativeKeywords.forEach((word) => {
        if (content.includes(word)) sentiment -= 1
      })
    })

    // Analyze recent performance trend
    if (stats.length >= 3) {
      const recent = stats.slice(-3)
      const older = stats.slice(-6, -3)

      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((sum, s) => sum + s.points, 0) / recent.length
        const olderAvg = older.reduce((sum, s) => sum + s.points, 0) / older.length

        if (recentAvg > olderAvg * 1.1) sentiment += 2
        else if (recentAvg < olderAvg * 0.9) sentiment -= 2
      }
    }

    if (sentiment > 1) return "up"
    if (sentiment < -1) return "down"
    return "stable"
  }

  private getInjuryImpact(player: SleeperPlayer, news: PlayerNews[]): "none" | "questionable" | "doubtful" | "out" {
    if (player.injury_status) {
      const status = player.injury_status.toLowerCase()
      if (status.includes("out") || status.includes("ir")) return "out"
      if (status.includes("doubtful")) return "doubtful"
      if (status.includes("questionable")) return "questionable"
    }

    // Check recent news for injury mentions
    const injuryNews = news.filter(
      (n) => n.tags.includes("injury") && Date.now() - new Date(n.published_date).getTime() < 3 * 24 * 60 * 60 * 1000,
    )

    if (injuryNews.length > 0) {
      return "questionable"
    }

    return "none"
  }

  private generateFantasyOutlook(
    player: SleeperPlayer,
    news: PlayerNews[],
    stats: PlayerStats[],
    trend: "up" | "down" | "stable",
  ): string {
    if (stats.length === 0 && news.length === 0) {
      return `${player.full_name} - No recent performance data or news available.`
    }

    const avgPoints = stats.length > 0 ? stats.reduce((sum, s) => sum + s.points, 0) / stats.length : 0
    const recentNews = news.length > 0 ? "Recent news available" : "No recent news"

    return `${player.full_name} - ${recentNews}. ${avgPoints > 0 ? `Averaging ${avgPoints.toFixed(1)} points.` : "No scoring data available."}`
  }

  private getCurrentWeek(): number {
    // Simple calculation - in production, this would be more sophisticated
    const now = new Date()
    const seasonStart = new Date(now.getFullYear(), 8, 1) // September 1st
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(18, weeksSinceStart + 1))
  }
}

export const playerService = new PlayerService()
export default playerService
