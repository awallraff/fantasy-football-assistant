export interface PlayerRanking {
  playerId: string
  playerName: string
  position: string
  team: string
  rank: number
  tier?: number
  projectedPoints?: number
  notes?: string
  adp?: number // Average Draft Position
  bye?: number
}

export interface RankingSystem {
  id: string
  name: string
  description: string
  source: string
  createdAt: string
  updatedAt: string
  season: string
  scoringFormat: "standard" | "ppr" | "half-ppr" | "superflex"
  positions: string[]
  rankings: PlayerRanking[]
  metadata?: {
    totalPlayers: number
    lastUpdated: string
    version?: string
    author?: string
  }
}

export interface RankingComparison {
  playerId: string
  playerName: string
  position: string
  team: string
  rankings: Array<{
    systemId: string
    systemName: string
    rank: number
    tier?: number
  }>
  averageRank: number
  rankVariance: number
}
