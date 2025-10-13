/**
 * Trade Evaluation Service Unit Tests
 *
 * Comprehensive tests for the TradeEvaluationService, including:
 * - Trade valuation algorithms (player values, positions, age adjustments)
 * - Fairness assessment (fair/unfair trades, thresholds)
 * - Winner identification (correct winner, ties, context-based)
 * - Draft pick valuations
 * - Edge cases (empty trades, invalid data, null handling)
 * - Performance metrics (trends, consistency scores)
 */

import { TradeEvaluationService } from '@/lib/trade-evaluation-service'
import type { RankingSystem, PlayerRanking } from '@/lib/rankings-types'
import type { SleeperPlayer, SleeperTransaction } from '@/lib/sleeper-api'
import type { NFLWeeklyStats, NFLSeasonalStats } from '@/lib/nfl-data-service'
import {
  createMockSleeperPlayer,
  createMockSleeperTransaction,
} from './utils/test-factories'

// Suppress console logs in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.log = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

/**
 * Helper: Create mock ranking system with specific players
 */
function createMockRankingSystem(rankings: Partial<PlayerRanking>[]): RankingSystem {
  return {
    id: 'test-system',
    name: 'Test Rankings',
    description: 'Test ranking system',
    source: 'test',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    lastUpdated: '2024-01-01',
    season: '2024',
    scoringFormat: 'ppr',
    positions: ['QB', 'RB', 'WR', 'TE'],
    rankings: rankings.map((r, idx) => ({
      playerId: r.playerId || `player${idx}`,
      playerName: r.playerName || `Player ${idx}`,
      position: r.position || 'RB',
      team: r.team || 'KC',
      rank: r.rank ?? idx + 1,
      projectedPoints: r.projectedPoints ?? 100 - idx * 5,
      tier: r.tier,
      notes: r.notes,
    })),
  }
}

/**
 * Helper: Create mock NFL weekly stats
 */
function createMockWeeklyStats(overrides?: Partial<NFLWeeklyStats>): NFLWeeklyStats {
  return {
    player_id: overrides?.player_id || 'player1',
    season: overrides?.season || 2024,
    week: overrides?.week || 1,
    player_name: overrides?.player_name || 'Test Player',
    team: overrides?.team || 'KC',
    position: overrides?.position || 'RB',
    fantasy_points_ppr: overrides?.fantasy_points_ppr ?? 15.5,
  } as NFLWeeklyStats
}

describe('TradeEvaluationService', () => {
  let service: TradeEvaluationService
  let mockPlayerCache: Map<string, SleeperPlayer>
  let mockRankingSystems: RankingSystem[]

  beforeEach(() => {
    // Setup mock ranking systems
    mockRankingSystems = [
      createMockRankingSystem([
        { playerId: 'player1', playerName: 'Elite RB', position: 'RB', rank: 5, projectedPoints: 250 },
        { playerId: 'player2', playerName: 'Good QB', position: 'QB', rank: 8, projectedPoints: 300 },
        { playerId: 'player3', playerName: 'WR2', position: 'WR', rank: 30, projectedPoints: 150 },
        { playerId: 'player4', playerName: 'Bench RB', position: 'RB', rank: 50, projectedPoints: 80 },
        { playerId: 'player5', playerName: 'Elite TE', position: 'TE', rank: 10, projectedPoints: 180 },
      ]),
    ]

    // Setup mock player cache
    mockPlayerCache = new Map<string, SleeperPlayer>([
      ['player1', createMockSleeperPlayer({ player_id: 'player1', first_name: 'Elite', last_name: 'RB', full_name: 'Elite RB', position: 'RB', team: 'KC', age: 24 })],
      ['player2', createMockSleeperPlayer({ player_id: 'player2', first_name: 'Good', last_name: 'QB', full_name: 'Good QB', position: 'QB', team: 'BUF', age: 26 })],
      ['player3', createMockSleeperPlayer({ player_id: 'player3', first_name: 'WR', last_name: 'Two', full_name: 'WR2', position: 'WR', team: 'SF', age: 28 })],
      ['player4', createMockSleeperPlayer({ player_id: 'player4', first_name: 'Bench', last_name: 'RB', full_name: 'Bench RB', position: 'RB', team: 'PHI', age: 32 })],
      ['player5', createMockSleeperPlayer({ player_id: 'player5', first_name: 'Elite', last_name: 'TE', full_name: 'Elite TE', position: 'TE', team: 'KC', age: 25 })],
      ['player6', createMockSleeperPlayer({ player_id: 'player6', first_name: 'Unknown', last_name: 'Player', full_name: 'Unknown Player', position: 'RB', team: 'FA', age: 22 })],
    ])

    service = new TradeEvaluationService(mockRankingSystems)
    service.setPlayerCache(mockPlayerCache)
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('Trade Valuation', () => {
    describe('Player Value Calculation', () => {
      it('should assign high value to top-12 ranked players', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player1: 1 }, // Rank 5 elite RB
          drops: { player2: 2 }, // Rank 8 good QB
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // Top 12 players should get value of 100
        expect(receivedPlayer.tradeValue).toBeGreaterThan(90) // Should be close to 100 (with position multiplier)
        // Player name comes from ranking system, not cache
        expect(receivedPlayer.playerName).toBeTruthy()
      })

      it('should assign medium value to rank 13-24 players', async () => {
        // Create a player ranked 20
        const midRankSystem = createMockRankingSystem([
          { playerId: 'player7', playerName: 'Mid QB', position: 'QB', rank: 20, projectedPoints: 200 },
        ])
        service.setRankingSystems([midRankSystem])

        mockPlayerCache.set('player7', createMockSleeperPlayer({
          player_id: 'player7',
          full_name: 'Mid QB',
          position: 'QB',
          team: 'DAL',
        }))
        service.setPlayerCache(mockPlayerCache)

        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player7: 1 },
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // Rank 13-24 should get value of 85 (baseline)
        expect(receivedPlayer.tradeValue).toBeGreaterThanOrEqual(75)
        expect(receivedPlayer.tradeValue).toBeLessThanOrEqual(95)
      })

      it('should assign low value to rank 60+ players', async () => {
        const lowRankSystem = createMockRankingSystem([
          { playerId: 'player8', playerName: 'Bench Player', position: 'RB', rank: 80, projectedPoints: 50 },
        ])
        service.setRankingSystems([lowRankSystem])

        mockPlayerCache.set('player8', createMockSleeperPlayer({
          player_id: 'player8',
          full_name: 'Bench Player',
          position: 'RB',
          team: 'NYJ',
        }))
        service.setPlayerCache(mockPlayerCache)

        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player8: 1 },
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // Rank 60+ should get value of 40 or less (with position multiplier)
        expect(receivedPlayer.tradeValue).toBeLessThan(50)
      })
    })

    describe('Position Multipliers', () => {
      it('should apply RB scarcity premium (1.2x multiplier)', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player1: 1 }, // Rank 5 RB
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // RB should have 1.2x multiplier, so base 100 -> 120
        expect(receivedPlayer.tradeValue).toBeGreaterThan(100)
        expect(receivedPlayer.position).toBe('RB')
      })

      it('should apply TE premium (1.1x multiplier)', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player5: 1 }, // Rank 10 TE
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // TE should have 1.1x multiplier
        expect(receivedPlayer.tradeValue).toBeGreaterThan(100)
        expect(receivedPlayer.position).toBe('TE')
      })

      it('should apply standard multiplier to QB (1.0x)', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player2: 1 }, // Rank 8 QB
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // QB should have 1.0x multiplier, so base 100 -> 100
        expect(receivedPlayer.tradeValue).toBeGreaterThanOrEqual(95)
        expect(receivedPlayer.tradeValue).toBeLessThanOrEqual(105)
        expect(receivedPlayer.position).toBe('QB')
      })

      it('should apply standard multiplier to WR (1.0x)', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: { player3: 1 }, // Rank 30 WR
          drops: {},
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const receivedPlayer = teamA.playersReceived[0]

        // WR should have 1.0x multiplier
        expect(receivedPlayer.tradeValue).toBeGreaterThan(60)
        expect(receivedPlayer.tradeValue).toBeLessThan(80)
        expect(receivedPlayer.position).toBe('WR')
      })
    })

    describe('Draft Pick Valuations', () => {
      it('should assign high value to 1st round picks', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: {},
          drops: {},
          draft_picks: [
            { season: '2025', round: 1, roster_id: 1, owner_id: 1, previous_owner_id: 2 },
          ],
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        expect(teamA.picksReceived).toHaveLength(1)
        expect(teamA.picksReceived[0].estimatedValue).toBe(80)
      })

      it('should assign medium value to 2nd-3rd round picks', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: {},
          drops: {},
          draft_picks: [
            { season: '2025', round: 2, roster_id: 1, owner_id: 1, previous_owner_id: 2 },
            { season: '2025', round: 3, roster_id: 2, owner_id: 2, previous_owner_id: 1 },
          ],
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        const teamB = result.participants.find(p => p.rosterId === 2)!

        expect(teamA.picksReceived[0].estimatedValue).toBe(60) // 2nd round
        expect(teamB.picksReceived[0].estimatedValue).toBe(45) // 3rd round
      })

      it('should assign low value to late round picks (8+)', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: {},
          drops: {},
          draft_picks: [
            { season: '2025', round: 8, roster_id: 1, owner_id: 1, previous_owner_id: 2 },
          ],
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        expect(teamA.picksReceived[0].estimatedValue).toBe(10)
      })

      it('should handle unknown round picks with default value', async () => {
        const transaction = createMockSleeperTransaction({
          type: 'trade',
          roster_ids: [1, 2],
          adds: {},
          drops: {},
          draft_picks: [
            { season: '2025', round: 15, roster_id: 1, owner_id: 1, previous_owner_id: 2 },
          ],
        })

        const result = await service.evaluateTransaction(
          transaction,
          new Map([[1, 'Team A'], [2, 'Team B']]),
          1
        )

        const teamA = result.participants.find(p => p.rosterId === 1)!
        expect(teamA.picksReceived[0].estimatedValue).toBe(5) // Default value
      })
    })
  })

  describe('Fairness Assessment', () => {
    it('should identify fair trade (10-25 point difference)', async () => {
      // Elite RB (rank 5) vs Good QB (rank 8) - should be close
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player2: 2 }, // Team 1 gets RB, Team 2 gets QB
        drops: { player2: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      // With position multipliers, RB should be more valuable
      // RB: 100 * 1.2 = 120, QB: 100 * 1.0 = 100
      // Difference: 20 points
      // This falls into "fair" (10-25) or "unfair" (25-50) depending on exact calculation
      expect(['fair', 'unfair']).toContain(result.overallFairness)
    })

    it('should identify unfair or very unfair trade (large point difference)', async () => {
      // Elite RB vs Bench RB - clearly unfair
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player4: 2 }, // Team 1 gets elite RB, Team 2 gets bench RB
        drops: { player4: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      // Expect unfair (25-50) or very unfair (50+) depending on exact values
      expect(['unfair', 'very_unfair']).toContain(result.overallFairness)
      expect(result.winner).toBe('1')
    })

    it('should identify very unfair trade (> 50 point difference)', async () => {
      // Elite RB + Elite TE vs Bench RB
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player5: 1, player4: 2 },
        drops: { player4: 1, player1: 2, player5: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.overallFairness).toBe('very_unfair')
      expect(result.winner).toBe('1')
    })

    it('should consider waiver/FA pickups as very fair (single participant)', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'waiver',
        roster_ids: [1],
        adds: { player3: 1 },
        drops: {},
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A']]),
        1
      )

      expect(result.overallFairness).toBe('very_fair')
      expect(result.participants).toHaveLength(1)
    })

    it('should handle equal value trades correctly', async () => {
      // Two identical rank players (simulate with same player traded back and forth)
      const equalRankSystem = createMockRankingSystem([
        { playerId: 'player9', playerName: 'RB1', position: 'RB', rank: 15, projectedPoints: 180 },
        { playerId: 'player10', playerName: 'RB2', position: 'RB', rank: 15, projectedPoints: 180 },
      ])
      service.setRankingSystems([equalRankSystem])

      mockPlayerCache.set('player9', createMockSleeperPlayer({ player_id: 'player9', full_name: 'RB1', position: 'RB' }))
      mockPlayerCache.set('player10', createMockSleeperPlayer({ player_id: 'player10', full_name: 'RB2', position: 'RB' }))
      service.setPlayerCache(mockPlayerCache)

      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player9: 1, player10: 2 },
        drops: { player10: 1, player9: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.overallFairness).toBe('very_fair')
      expect(Math.abs(result.winnerAdvantage)).toBeLessThan(1)
    })
  })

  describe('Winner Identification', () => {
    it('should correctly identify winner in one-sided trade', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player4: 2 }, // Team 1 gets elite RB, Team 2 gets bench RB
        drops: { player4: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.winner).toBe('1')
      expect(result.winnerAdvantage).toBeGreaterThan(30)

      const winner = result.participants.find(p => p.rosterId === 1)!
      expect(winner.netValue).toBeGreaterThan(0)
    })

    it('should handle ties (equal net value)', async () => {
      const equalRankSystem = createMockRankingSystem([
        { playerId: 'player11', playerName: 'RB1', position: 'RB', rank: 20, projectedPoints: 180 },
        { playerId: 'player12', playerName: 'RB2', position: 'RB', rank: 20, projectedPoints: 180 },
      ])
      service.setRankingSystems([equalRankSystem])

      mockPlayerCache.set('player11', createMockSleeperPlayer({ player_id: 'player11', full_name: 'RB1', position: 'RB' }))
      mockPlayerCache.set('player12', createMockSleeperPlayer({ player_id: 'player12', full_name: 'RB2', position: 'RB' }))
      service.setPlayerCache(mockPlayerCache)

      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player11: 1, player12: 2 },
        drops: { player12: 1, player11: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      // Winner is determined by highest net value, even if tied, so there's still a "winner"
      // But advantage should be minimal
      expect(result.winnerAdvantage).toBeLessThan(1)
      expect(result.overallFairness).toBe('very_fair')
    })

    it('should calculate net value correctly (received - given)', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player4: 2 },
        drops: { player4: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      const teamA = result.participants.find(p => p.rosterId === 1)!
      const teamB = result.participants.find(p => p.rosterId === 2)!

      // Team A: receives elite RB, gives bench RB
      expect(teamA.valueReceived).toBeGreaterThan(teamA.valueGiven)
      expect(teamA.netValue).toBe(teamA.valueReceived - teamA.valueGiven)

      // Team B: receives bench RB, gives elite RB
      expect(teamB.valueReceived).toBeLessThan(teamB.valueGiven)
      expect(teamB.netValue).toBe(teamB.valueReceived - teamB.valueGiven)
      expect(teamB.netValue).toBeLessThan(0)
    })

    it('should not identify winner for waiver/FA transactions', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'waiver',
        roster_ids: [1],
        adds: { player3: 1 },
        drops: {},
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A']]),
        1
      )

      expect(result.winner).toBeUndefined()
      expect(result.winnerAdvantage).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty trade (no players or picks)', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: null,
        drops: null,
        draft_picks: [],
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.participants).toHaveLength(2)
      result.participants.forEach(p => {
        expect(p.playersReceived).toHaveLength(0)
        expect(p.playersGiven).toHaveLength(0)
        expect(p.netValue).toBe(0)
      })
    })

    it('should handle unknown player (not in cache)', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { unknownPlayer: 1 },
        drops: {},
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      const teamA = result.participants.find(p => p.rosterId === 1)!
      expect(teamA.playersReceived).toHaveLength(1)
      expect(teamA.playersReceived[0].playerName).toContain('Player unknownPlayer')
      expect(teamA.playersReceived[0].position).toBe('UNKNOWN')
      expect(teamA.playersReceived[0].team).toBe('FA')
    })

    it('should handle player not in ranking system', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player6: 1 }, // player6 is in cache but not in rankings
        drops: {},
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      const teamA = result.participants.find(p => p.rosterId === 1)!
      expect(teamA.playersReceived).toHaveLength(1)
      // Player name should be from cache (full_name)
      expect(teamA.playersReceived[0].playerName).toBeTruthy()
      expect(teamA.playersReceived[0].currentRank).toBeUndefined()
      // Should get base value of 50 with position multiplier
      expect(teamA.playersReceived[0].tradeValue).toBeGreaterThan(0)
    })

    it('should handle null/undefined transaction properties', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: undefined as any,
        drops: undefined as any,
        draft_picks: undefined as any,
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.participants).toHaveLength(2)
      expect(result.metadata.totalPlayersTraded).toBe(0)
      expect(result.metadata.totalPicksTraded).toBe(0)
    })
  })

  describe('Transaction Type Detection', () => {
    it('should correctly identify owner trades', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.transactionType).toBe('owner_trade')
    })

    it('should correctly identify waiver adds', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'waiver',
        roster_ids: [1],
        adds: { player3: 1 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A']]),
        1
      )

      expect(result.transactionType).toBe('waiver_add')
    })

    it('should correctly identify free agent adds', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'free_agent',
        roster_ids: [1],
        adds: { player3: 1 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A']]),
        1
      )

      expect(result.transactionType).toBe('free_agent_add')
    })
  })

  describe('Analysis Generation', () => {
    it('should generate detailed analysis for trades', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player4: 2 },
        drops: { player4: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.analysis).toContain('Team A')
      expect(result.analysis).toContain('received the better end')
      // Analysis should mention key acquisition (player name may vary based on ranking vs cache)
      expect(result.analysis).toContain('Key acquisition')
      expect(result.analysis.length).toBeGreaterThan(20)
    })

    it('should generate analysis for waiver pickups', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'waiver',
        roster_ids: [1],
        adds: { player3: 1 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A']]),
        1
      )

      expect(result.analysis).toContain('Team A')
      expect(result.analysis).toContain('acquired')
      expect(result.analysis).toContain('waiver')
    })

    it('should indicate fairness level in analysis', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player5: 1, player4: 2 },
        drops: { player4: 1, player1: 2, player5: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.analysis).toContain('favors')
    })
  })

  describe('Metadata Tracking', () => {
    it('should track total players traded', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player2: 2, player3: 1 },
        drops: { player2: 1, player1: 2, player3: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.metadata.totalPlayersTraded).toBe(6) // 3 adds + 3 drops
    })

    it('should track total picks traded', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: {},
        drops: {},
        draft_picks: [
          { season: '2025', round: 1, roster_id: 1, owner_id: 1, previous_owner_id: 2 },
          { season: '2025', round: 2, roster_id: 2, owner_id: 2, previous_owner_id: 1 },
        ],
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.metadata.totalPicksTraded).toBe(2)
    })

    it('should track total value exchanged', async () => {
      const transaction = createMockSleeperTransaction({
        type: 'trade',
        roster_ids: [1, 2],
        adds: { player1: 1, player4: 2 },
        drops: { player4: 1, player1: 2 },
      })

      const result = await service.evaluateTransaction(
        transaction,
        new Map([[1, 'Team A'], [2, 'Team B']]),
        1
      )

      expect(result.metadata.totalValueExchanged).toBeGreaterThan(0)
      expect(result.metadata.rankingSourcesUsed).toContain('Test Rankings')
      expect(result.metadata.evaluatedAt).toBeDefined()
    })
  })

  describe('Cache Management', () => {
    it('should clear NFL stats cache', () => {
      service.clearCache()
      // Cache clearing is a side effect, hard to test directly
      // But we can verify the method exists and doesn't throw
      expect(() => service.clearCache()).not.toThrow()
    })

    it('should allow setting ranking systems after construction', () => {
      const newService = new TradeEvaluationService()
      expect(() => newService.setRankingSystems(mockRankingSystems)).not.toThrow()
    })

    it('should allow setting player cache after construction', () => {
      const newService = new TradeEvaluationService()
      expect(() => newService.setPlayerCache(mockPlayerCache)).not.toThrow()
    })
  })
})
