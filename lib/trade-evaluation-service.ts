/**
 * Trade Evaluation Service
 * Evaluates fantasy football trades using ranking data and NFL statistics
 */

import type { SleeperTransaction, SleeperPlayer } from './sleeper-api'
import type { PlayerRanking, RankingSystem } from './rankings-types'
import type { NFLWeeklyStats, NFLSeasonalStats } from './nfl-data-service'
import { nflDataService } from './nfl-data-service'

export interface TradeParticipant {
  rosterId: number
  ownerName: string
  playersReceived: TradePlayer[]
  playersGiven: TradePlayer[]
  picksReceived: TradePick[]
  picksGiven: TradePick[]
  valueReceived: number
  valueGiven: number
  netValue: number
}

export interface TradePlayer {
  playerId: string
  playerName: string
  position: string
  team: string
  currentRank?: number
  projectedPoints?: number
  recentPerformance?: PlayerPerformanceMetrics
  tradeValue: number
}

export interface TradePick {
  season: string
  round: number
  estimatedValue: number
}

export interface PlayerPerformanceMetrics {
  last4WeeksAvg: number
  seasonAvg: number
  trend: 'improving' | 'declining' | 'stable'
  gamesPlayed: number
  consistencyScore: number // 0-100, higher = more consistent
}

export interface TradeEvaluation {
  transactionId: string
  transactionType: 'owner_trade' | 'waiver_add' | 'free_agent_add'
  tradeDate: Date
  week?: number
  participants: TradeParticipant[]
  winner?: string // rosterId of the team that won the trade
  winnerAdvantage: number // How much better the winner did (in value points)
  overallFairness: 'very_unfair' | 'unfair' | 'fair' | 'very_fair'
  analysis: string
  metadata: {
    totalPlayersTraded: number
    totalPicksTraded: number
    totalValueExchanged: number
    rankingSourcesUsed: string[]
    evaluatedAt: string
  }
}

export class TradeEvaluationService {
  private rankingSystems: RankingSystem[] = []
  private playerCache: Map<string, SleeperPlayer> = new Map()
  private nflStatsCache: Map<string, { weekly: NFLWeeklyStats[], seasonal: NFLSeasonalStats[] }> = new Map()

  constructor(rankingSystems: RankingSystem[] = []) {
    this.rankingSystems = rankingSystems
  }

  /**
   * Set ranking systems to use for player valuation
   */
  setRankingSystems(systems: RankingSystem[]) {
    this.rankingSystems = systems
  }

  /**
   * Set player cache for name resolution
   */
  setPlayerCache(players: Map<string, SleeperPlayer>) {
    this.playerCache = players
  }

  /**
   * Main method: Evaluate a transaction (trade, waiver, or free agent)
   */
  async evaluateTransaction(
    transaction: SleeperTransaction,
    rosterIdToOwnerName: Map<number, string>,
    week?: number
  ): Promise<TradeEvaluation> {
    const transactionType = this.getTransactionType(transaction)

    // Build participant map
    const participantMap = new Map<number, TradeParticipant>()

    // Initialize participants
    for (const rosterId of transaction.roster_ids || []) {
      participantMap.set(rosterId, {
        rosterId,
        ownerName: rosterIdToOwnerName.get(rosterId) || `Team ${rosterId}`,
        playersReceived: [],
        playersGiven: [],
        picksReceived: [],
        picksGiven: [],
        valueReceived: 0,
        valueGiven: 0,
        netValue: 0,
      })
    }

    // Process player adds (who received which players)
    if (transaction.adds) {
      for (const [playerId, receivingRosterId] of Object.entries(transaction.adds)) {
        const participant = participantMap.get(receivingRosterId)
        if (participant) {
          const tradePlayer = await this.evaluatePlayer(playerId, week)
          participant.playersReceived.push(tradePlayer)
          participant.valueReceived += tradePlayer.tradeValue
        }
      }
    }

    // Process player drops (who gave up which players)
    if (transaction.drops) {
      for (const [playerId, givingRosterId] of Object.entries(transaction.drops)) {
        const participant = participantMap.get(givingRosterId)
        if (participant) {
          const tradePlayer = await this.evaluatePlayer(playerId, week)
          participant.playersGiven.push(tradePlayer)
          participant.valueGiven += tradePlayer.tradeValue
        }
      }
    }

    // Process draft picks
    if (transaction.draft_picks) {
      for (const pick of transaction.draft_picks) {
        const receiver = participantMap.get(pick.owner_id)
        const giver = participantMap.get(pick.previous_owner_id)

        const tradePick: TradePick = {
          season: pick.season,
          round: pick.round,
          estimatedValue: this.estimatePickValue(pick.round),
        }

        if (receiver) {
          receiver.picksReceived.push(tradePick)
          receiver.valueReceived += tradePick.estimatedValue
        }

        if (giver) {
          giver.picksGiven.push(tradePick)
          giver.valueGiven += tradePick.estimatedValue
        }
      }
    }

    // Calculate net value for each participant
    participantMap.forEach((participant) => {
      participant.netValue = participant.valueReceived - participant.valueGiven
    })

    const allParticipants = Array.from(participantMap.values())

    // Determine winner (participant with highest net value)
    let winner: string | undefined
    let winnerAdvantage = 0
    if (transactionType === 'owner_trade' && allParticipants.length > 0) {
      const sorted = [...allParticipants].sort((a, b) => b.netValue - a.netValue)
      winner = sorted[0].rosterId.toString()
      winnerAdvantage = sorted[0].netValue - (sorted[1]?.netValue || 0)
    }

    // Determine fairness
    const overallFairness = this.determineFairness(winnerAdvantage, allParticipants.length)

    // Generate analysis
    const analysis = this.generateTradeAnalysis(allParticipants, transactionType, winnerAdvantage)

    return {
      transactionId: transaction.transaction_id,
      transactionType,
      tradeDate: new Date(transaction.created),
      week,
      participants: allParticipants,
      winner,
      winnerAdvantage,
      overallFairness,
      analysis,
      metadata: {
        totalPlayersTraded: (Object.keys(transaction.adds || {}).length + Object.keys(transaction.drops || {}).length),
        totalPicksTraded: transaction.draft_picks?.length || 0,
        totalValueExchanged: allParticipants.reduce((sum, p) => sum + p.valueReceived, 0),
        rankingSourcesUsed: this.rankingSystems.map(r => r.name),
        evaluatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Determine transaction type
   */
  private getTransactionType(transaction: SleeperTransaction): 'owner_trade' | 'waiver_add' | 'free_agent_add' {
    if (transaction.type === 'trade') {
      return 'owner_trade'
    } else if (transaction.type === 'waiver') {
      return 'waiver_add'
    } else {
      return 'free_agent_add'
    }
  }

  /**
   * Evaluate a single player's trade value
   */
  private async evaluatePlayer(playerId: string, week?: number): Promise<TradePlayer> {
    const player = this.playerCache.get(playerId)
    const playerName = player?.full_name || player?.first_name && player?.last_name
      ? `${player.first_name} ${player.last_name}`
      : `Player ${playerId}`
    const position = player?.position || 'UNKNOWN'
    const team = player?.team || 'FA'

    // Get ranking data
    const rankingData = this.getPlayerRanking(playerId, position)

    // Get NFL performance data
    const performanceMetrics = await this.getPlayerPerformance(playerId, week)

    // Calculate trade value
    const tradeValue = this.calculateTradeValue(rankingData, performanceMetrics, position)

    return {
      playerId,
      playerName,
      position,
      team,
      currentRank: rankingData?.rank,
      projectedPoints: rankingData?.projectedPoints,
      recentPerformance: performanceMetrics,
      tradeValue,
    }
  }

  /**
   * Get player ranking from ranking systems
   */
  private getPlayerRanking(playerId: string, position: string): PlayerRanking | null {
    if (this.rankingSystems.length === 0) return null

    // Try to find player in ranking systems
    const rankings: PlayerRanking[] = []

    for (const system of this.rankingSystems) {
      const ranking = system.rankings.find(r =>
        r.playerId === playerId ||
        r.playerName.toLowerCase().includes(playerId.toLowerCase())
      )
      if (ranking) {
        rankings.push(ranking)
      }
    }

    if (rankings.length === 0) return null

    // Average the rankings
    return {
      playerId,
      playerName: rankings[0].playerName,
      position,
      team: rankings[0].team,
      rank: Math.round(rankings.reduce((sum, r) => sum + r.rank, 0) / rankings.length),
      projectedPoints: rankings.reduce((sum, r) => sum + (r.projectedPoints || 0), 0) / rankings.length,
    }
  }

  /**
   * Get player performance metrics from NFL data
   */
  private async getPlayerPerformance(playerId: string, currentWeek?: number): Promise<PlayerPerformanceMetrics | undefined> {
    try {
      // Check cache
      if (this.nflStatsCache.has(playerId)) {
        const cached = this.nflStatsCache.get(playerId)!
        return this.calculatePerformanceMetrics(cached.weekly, cached.seasonal, currentWeek)
      }

      // Fetch from NFL data service
      const currentSeason = nflDataService.getCurrentSeason()
      const { weekly, seasonal } = await nflDataService.getPlayerStats(playerId, [currentSeason])

      // Cache results
      this.nflStatsCache.set(playerId, { weekly, seasonal })

      return this.calculatePerformanceMetrics(weekly, seasonal, currentWeek)
    } catch (error) {
      console.error(`Error fetching performance for player ${playerId}:`, error)
      return undefined
    }
  }

  /**
   * Calculate performance metrics from weekly/seasonal stats
   */
  private calculatePerformanceMetrics(
    weekly: NFLWeeklyStats[],
    seasonal: NFLSeasonalStats[],
    currentWeek?: number
  ): PlayerPerformanceMetrics | undefined {
    if (weekly.length === 0 && seasonal.length === 0) return undefined

    // Filter to relevant weeks
    const relevantWeekly = currentWeek
      ? weekly.filter(w => w.week <= currentWeek)
      : weekly

    if (relevantWeekly.length === 0) return undefined

    // Last 4 weeks average
    const last4Weeks = relevantWeekly.slice(-4)
    const last4WeeksAvg = last4Weeks.reduce((sum, w) => sum + (w.fantasy_points_ppr || 0), 0) / last4Weeks.length

    // Season average
    const seasonAvg = relevantWeekly.reduce((sum, w) => sum + (w.fantasy_points_ppr || 0), 0) / relevantWeekly.length

    // Trend detection
    const trend = this.detectTrend(relevantWeekly)

    // Consistency score (standard deviation, inverted)
    const consistencyScore = this.calculateConsistency(relevantWeekly)

    return {
      last4WeeksAvg,
      seasonAvg,
      trend,
      gamesPlayed: relevantWeekly.length,
      consistencyScore,
    }
  }

  /**
   * Detect player performance trend
   */
  private detectTrend(weekly: NFLWeeklyStats[]): 'improving' | 'declining' | 'stable' {
    if (weekly.length < 4) return 'stable'

    const recent4 = weekly.slice(-4)
    const previous4 = weekly.slice(-8, -4)

    if (previous4.length === 0) return 'stable'

    const recentAvg = recent4.reduce((sum, w) => sum + (w.fantasy_points_ppr || 0), 0) / recent4.length
    const previousAvg = previous4.reduce((sum, w) => sum + (w.fantasy_points_ppr || 0), 0) / previous4.length

    const change = ((recentAvg - previousAvg) / previousAvg) * 100

    if (change > 15) return 'improving'
    if (change < -15) return 'declining'
    return 'stable'
  }

  /**
   * Calculate consistency score (0-100, higher = more consistent)
   */
  private calculateConsistency(weekly: NFLWeeklyStats[]): number {
    if (weekly.length < 2) return 50

    const points = weekly.map(w => w.fantasy_points_ppr || 0)
    const avg = points.reduce((sum, p) => sum + p, 0) / points.length
    const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length
    const stdDev = Math.sqrt(variance)

    // Normalize to 0-100 (inverse of coefficient of variation)
    const cv = avg > 0 ? stdDev / avg : 1
    return Math.max(0, Math.min(100, 100 - (cv * 50)))
  }

  /**
   * Calculate overall trade value for a player
   */
  private calculateTradeValue(
    ranking: PlayerRanking | null,
    performance: PlayerPerformanceMetrics | undefined,
    position: string
  ): number {
    let value = 50 // Base value

    // Ranking-based value (0-100 scale, inverted so lower rank = higher value)
    if (ranking) {
      if (ranking.rank <= 12) value = 100
      else if (ranking.rank <= 24) value = 85
      else if (ranking.rank <= 36) value = 70
      else if (ranking.rank <= 60) value = 55
      else if (ranking.rank <= 100) value = 40
      else value = 25
    }

    // Performance adjustment
    if (performance) {
      // Recent performance boost
      if (performance.last4WeeksAvg > performance.seasonAvg * 1.2) {
        value += 10
      } else if (performance.last4WeeksAvg < performance.seasonAvg * 0.8) {
        value -= 10
      }

      // Trend adjustment
      if (performance.trend === 'improving') value += 5
      else if (performance.trend === 'declining') value -= 5

      // Consistency bonus
      if (performance.consistencyScore > 70) value += 5
      else if (performance.consistencyScore < 30) value -= 5
    }

    // Position multipliers (scarcity premium)
    const positionMultipliers: Record<string, number> = {
      QB: 1.0,
      RB: 1.2,  // RBs are scarce
      WR: 1.0,
      TE: 1.1,  // Top TEs have premium
    }

    value *= positionMultipliers[position] || 1.0

    return Math.max(0, Math.min(150, value)) // Cap between 0-150
  }

  /**
   * Estimate draft pick value
   */
  private estimatePickValue(round: number): number {
    // Standard pick value chart (0-100 scale)
    const pickValues: Record<number, number> = {
      1: 80,
      2: 60,
      3: 45,
      4: 35,
      5: 25,
      6: 20,
      7: 15,
      8: 10,
      9: 8,
      10: 5,
    }

    return pickValues[round] || 5
  }

  /**
   * Determine trade fairness
   */
  private determineFairness(advantagePoints: number, participantCount: number): 'very_unfair' | 'unfair' | 'fair' | 'very_fair' {
    if (participantCount === 1) return 'very_fair' // Waiver/FA pickups

    const absAdvantage = Math.abs(advantagePoints)

    if (absAdvantage < 10) return 'very_fair'
    if (absAdvantage < 25) return 'fair'
    if (absAdvantage < 50) return 'unfair'
    return 'very_unfair'
  }

  /**
   * Generate human-readable trade analysis
   */
  private generateTradeAnalysis(
    participants: TradeParticipant[],
    transactionType: string,
    advantage: number
  ): string {
    if (transactionType !== 'owner_trade') {
      const participant = participants[0]
      if (!participant) return 'Transaction details unavailable'

      const players = participant.playersReceived
      if (players.length === 0) return 'No players involved in transaction'

      return `${participant.ownerName} acquired ${players.map(p => `${p.playerName} (Rank: ${p.currentRank || 'N/A'})`).join(', ')} via ${transactionType === 'waiver_add' ? 'waiver' : 'free agency'}.`
    }

    // Owner-to-owner trade analysis
    if (participants.length < 2) return 'Insufficient trade data'

    const sorted = [...participants].sort((a, b) => b.netValue - a.netValue)
    const winner = sorted[0]

    let analysis = `${winner.ownerName} received the better end of this trade (+${winner.netValue.toFixed(1)} value). `

    // Detail what winner got
    if (winner.playersReceived.length > 0) {
      const topPlayer = winner.playersReceived.sort((a, b) => b.tradeValue - a.tradeValue)[0]
      analysis += `Key acquisition: ${topPlayer.playerName} (${topPlayer.position}, Rank ${topPlayer.currentRank || 'N/A'}). `
    }

    // Fairness assessment
    if (Math.abs(advantage) < 10) {
      analysis += 'Trade appears very balanced.'
    } else if (Math.abs(advantage) < 25) {
      analysis += 'Trade slightly favors one side but still reasonable.'
    } else {
      analysis += `Trade significantly favors ${winner.ownerName}.`
    }

    return analysis
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.nflStatsCache.clear()
  }
}

// Export singleton instance
export const tradeEvaluationService = new TradeEvaluationService()
export default tradeEvaluationService
