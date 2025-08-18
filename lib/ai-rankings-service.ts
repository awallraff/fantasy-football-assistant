import type { PlayerRanking, RankingSystem } from "./rankings-types"

export interface PublicRankingSource {
  name: string
  url: string
  weight: number
  reliability: number
}

export interface AIRankingConfig {
  userRankingWeight: number // Priority weight for user rankings
  publicSourceWeight: number
  aiAnalysisWeight: number
  positionScarcity: Record<string, number>
  leagueSettings?: {
    scoringFormat: "standard" | "ppr" | "half-ppr" | "superflex"
    startingPositions: Record<string, number>
    benchSize: number
    flexPositions: string[]
  }
}

export class AIRankingsService {
  private publicSources: PublicRankingSource[] = [
    { name: "FantasyPros", url: "fantasypros.com", weight: 0.3, reliability: 0.9 },
    { name: "ESPN", url: "espn.com", weight: 0.25, reliability: 0.8 },
    { name: "Yahoo", url: "yahoo.com", weight: 0.2, reliability: 0.8 },
    { name: "NFL.com", url: "nfl.com", weight: 0.15, reliability: 0.75 },
    { name: "CBS Sports", url: "cbssports.com", weight: 0.1, reliability: 0.7 },
  ]

  async fetchPublicRankings(position?: string, scoringFormat = "ppr"): Promise<RankingSystem[]> {
    const rankings: RankingSystem[] = []

    try {
      // Simulate fetching from multiple sources
      for (const source of this.publicSources) {
        const mockRankings = this.generateMockPublicRankings(source, position, scoringFormat)
        rankings.push(mockRankings)
      }

      return rankings
    } catch (error) {
      console.error("Error fetching public rankings:", error)
      return []
    }
  }

  generateAIRankings(
    userRankings: RankingSystem[],
    publicRankings: RankingSystem[],
    config: AIRankingConfig,
  ): RankingSystem {
    const allPlayers = new Map<string, PlayerRanking[]>()

    // Collect all player rankings from different sources
    userRankings.forEach((system) => {
      system.rankings.forEach((ranking) => {
        if (!allPlayers.has(ranking.playerId)) {
          allPlayers.set(ranking.playerId, [])
        }
        allPlayers.get(ranking.playerId)!.push({
          ...ranking,
          rank: this.adjustRankForSource(ranking.rank, system.source, config),
        })
      })
    })

    publicRankings.forEach((system) => {
      system.rankings.forEach((ranking) => {
        if (!allPlayers.has(ranking.playerId)) {
          allPlayers.set(ranking.playerId, [])
        }
        allPlayers.get(ranking.playerId)!.push({
          ...ranking,
          rank: this.adjustRankForSource(ranking.rank, system.source, config),
        })
      })
    })

    // Generate AI-infused combined rankings
    const combinedRankings: PlayerRanking[] = []

    allPlayers.forEach((playerRankings) => {
      const basePlayer = playerRankings[0]
      const aiRank = this.calculateAIRank(playerRankings, config)
      const aiTier = this.calculateTier(aiRank, basePlayer.position)

      combinedRankings.push({
        ...basePlayer,
        rank: aiRank,
        tier: aiTier,
        projectedPoints: this.calculateProjectedPoints(playerRankings),
        notes: this.generateAIInsights(playerRankings),
      })
    })

    // Sort by AI-calculated rank
    combinedRankings.sort((a, b) => a.rank - b.rank)

    return {
      id: `ai-combined-${Date.now()}`,
      name: "AI Combined Rankings",
      description: "AI-generated rankings combining user imports and public sources",
      source: "AI Analysis",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      season: "2025",
      scoringFormat: config.leagueSettings?.scoringFormat || "ppr",
      positions: [...new Set(combinedRankings.map((r) => r.position))],
      rankings: combinedRankings,
      metadata: {
        totalPlayers: combinedRankings.length,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        author: "AI Rankings Engine",
      },
    }
  }

  private adjustRankForSource(rank: number, source: string, config: AIRankingConfig): number {
    // Give priority weight to user rankings
    if (source.includes("User") || source.includes("Import")) {
      return rank * config.userRankingWeight
    }
    return rank * config.publicSourceWeight
  }

  private calculateAIRank(playerRankings: PlayerRanking[], config: AIRankingConfig): number {
    const weights = playerRankings.map((r) => {
      if (r.playerName.includes("User")) return config.userRankingWeight
      return config.publicSourceWeight
    })

    const weightedSum = playerRankings.reduce((sum, ranking, index) => {
      return sum + ranking.rank * weights[index]
    }, 0)

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    return Math.round(weightedSum / totalWeight)
  }

  private calculateTier(rank: number, position: string): number {
    const tierSizes = {
      QB: { 1: 12, 2: 24, 3: 36 },
      RB: { 1: 12, 2: 24, 3: 36, 4: 48 },
      WR: { 1: 12, 2: 24, 3: 36, 4: 48, 5: 60 },
      TE: { 1: 8, 2: 16, 3: 24 },
      K: { 1: 12, 2: 24 },
      DEF: { 1: 12, 2: 24 },
    }

    const tiers = tierSizes[position as keyof typeof tierSizes] || tierSizes.RB

    for (const [tier, maxRank] of Object.entries(tiers)) {
      if (rank <= maxRank) {
        return Number.parseInt(tier)
      }
    }

    return Object.keys(tiers).length + 1
  }

  private calculateProjectedPoints(playerRankings: PlayerRanking[]): number {
    const projections = playerRankings.filter((r) => r.projectedPoints).map((r) => r.projectedPoints!)

    if (projections.length === 0) return 0

    return Math.round(projections.reduce((sum, points) => sum + points, 0) / projections.length)
  }

  private generateAIInsights(playerRankings: PlayerRanking[]): string {
    const variance = this.calculateVariance(playerRankings.map((r) => r.rank))
    const avgRank = playerRankings.reduce((sum, r) => sum + r.rank, 0) / playerRankings.length

    const insights = []

    if (variance > 10) {
      insights.push("High ranking variance across sources")
    }

    if (avgRank <= 24) {
      insights.push("Consensus top-tier player")
    } else if (avgRank <= 60) {
      insights.push("Solid starter option")
    } else {
      insights.push("Depth/handcuff consideration")
    }

    return insights.join("; ")
  }

  private calculateVariance(ranks: number[]): number {
    const mean = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
    const squaredDiffs = ranks.map((rank) => Math.pow(rank - mean, 2))
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / ranks.length)
  }

  private generateMockPublicRankings(
    source: PublicRankingSource,
    position?: string,
    scoringFormat = "ppr",
  ): RankingSystem {
    // Generate mock rankings for demonstration
    const positions = position ? [position] : ["QB", "RB", "WR", "TE", "K", "DEF"]
    const rankings: PlayerRanking[] = []

    let rankCounter = 1

    positions.forEach((pos) => {
      const playersPerPosition = pos === "QB" ? 32 : pos === "TE" ? 24 : pos === "K" || pos === "DEF" ? 32 : 60

      for (let i = 1; i <= playersPerPosition; i++) {
        rankings.push({
          playerId: `${pos.toLowerCase()}_${i}_${source.name.toLowerCase()}`,
          playerName: `${pos} Player ${i}`,
          position: pos,
          team: "NFL",
          rank: rankCounter++,
          tier: Math.ceil(i / 12),
          projectedPoints: this.calculateMockProjection(pos, i, scoringFormat),
          adp: rankCounter - 1 + Math.random() * 10 - 5,
          bye: Math.floor(Math.random() * 14) + 4,
        })
      }
    })

    return {
      id: `${source.name.toLowerCase()}-${Date.now()}`,
      name: `${source.name} Rankings`,
      description: `Public rankings from ${source.name}`,
      source: source.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      season: "2025",
      scoringFormat: scoringFormat as "standard" | "ppr" | "half-ppr" | "superflex",
      positions,
      rankings,
      metadata: {
        totalPlayers: rankings.length,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        author: source.name,
      },
    }
  }

  private calculateMockProjection(position: string, rank: number, scoringFormat: string): number {
    const basePoints = {
      QB: 300 - rank * 8,
      RB: 250 - rank * 6,
      WR: 220 - rank * 5,
      TE: 180 - rank * 4,
      K: 120 - rank * 2,
      DEF: 140 - rank * 3,
    }

    let points = basePoints[position as keyof typeof basePoints] || 100

    // Adjust for scoring format
    if (scoringFormat === "ppr" && (position === "RB" || position === "WR" || position === "TE")) {
      points += rank <= 24 ? 50 : 30
    } else if (scoringFormat === "half-ppr" && (position === "RB" || position === "WR" || position === "TE")) {
      points += rank <= 24 ? 25 : 15
    }

    return Math.max(points, 50)
  }

  getRelevantPositions(leagueSettings?: AIRankingConfig["leagueSettings"]): string[] {
    if (!leagueSettings) {
      return ["QB", "RB", "WR", "TE", "K", "DEF"]
    }

    const positions: string[] = []

    Object.entries(leagueSettings.startingPositions).forEach(([pos, count]) => {
      if (count > 0) {
        positions.push(pos)
      }
    })

    // Add flex positions
    if (leagueSettings.flexPositions) {
      leagueSettings.flexPositions.forEach((pos) => {
        if (!positions.includes(pos)) {
          positions.push(pos)
        }
      })
    }

    return positions
  }
}

export const aiRankingsService = new AIRankingsService()
