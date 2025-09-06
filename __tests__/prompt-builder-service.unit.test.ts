import { PromptBuilderService } from '@/lib/prompt-builder-service'
import type { RankingSystem } from '@/lib/rankings-types'

describe('PromptBuilderService', () => {
  let service: PromptBuilderService
  let mockRankingSystems: RankingSystem[]
  let mockNflData: any

  beforeEach(() => {
    service = new PromptBuilderService()
    
    mockRankingSystems = [
      {
        id: 'test-system',
        name: 'Test Rankings',
        description: 'Test',
        source: 'Test',
        season: '2024',
        scoringFormat: 'ppr',
        positions: ['all'],
        rankings: [
          {
            rank: 1,
            playerId: 'player-1',
            playerName: 'Josh Allen',
            position: 'QB',
            team: 'BUF'
          },
          {
            rank: 2,
            playerId: 'player-2',
            playerName: 'Christian McCaffrey',
            position: 'RB',
            team: 'SF'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lastUpdated: '2024-01-01T00:00:00.000Z'
      }
    ]

    mockNflData = {
      aggregated_season_stats: [
        {
          player_name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          fantasy_points_ppr: 400,
          games: 16,
          passing_yards: 4500,
          passing_tds: 30,
          interceptions: 10
        }
      ],
      weekly_stats: [],
      metadata: {
        total_players: 1,
        total_aggregated_records: 1,
        years: [2024]
      }
    }
  })

  describe('buildPromptWithHistoricalData', () => {
    it('should build comprehensive prompt with historical data', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        mockNflData,
        { year: 2024 }
      )

      expect(result).toContain('Analyze the following player rankings')
      expect(result).toContain('HISTORICAL NFL PERFORMANCE DATA')
      expect(result).toContain('USER PROVIDED RANKINGS')
      expect(result).toContain('Test Rankings')
      expect(result).toContain('Josh Allen')
      expect(result).toContain('2024 Season Performance')
      expect(result).toContain('QB PERFORMANCE METRICS')
    })

    it('should build prompt for weekly projections', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        mockNflData,
        { year: 2024, week: 5 }
      )

      expect(result).toContain('Week 5, 2024 Performance')
    })

    it('should handle missing NFL data gracefully', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        null,
        { year: 2024 }
      )

      expect(result).not.toContain('HISTORICAL NFL PERFORMANCE DATA')
      expect(result).toContain('USER PROVIDED RANKINGS')
      expect(result).toContain('Josh Allen')
    })

    it('should handle empty ranking systems', () => {
      const result = service.buildPromptWithHistoricalData(
        [],
        mockNflData,
        { year: 2024 }
      )

      expect(result).toContain('HISTORICAL NFL PERFORMANCE DATA')
      expect(result).not.toContain('USER PROVIDED RANKINGS')
    })

    it('should include trend analysis guidelines', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        mockNflData
      )

      expect(result).toContain('TREND ANALYSIS GUIDELINES')
      expect(result).toContain('Prioritize players with consistent high performance')
      expect(result).toContain('Consider efficiency metrics')
      expect(result).toContain('Weight red zone usage')
    })

    it('should limit rankings to top 20 per source', () => {
      // Create system with many players
      const manyPlayerSystem: RankingSystem = {
        ...mockRankingSystems[0],
        rankings: Array.from({ length: 30 }, (_, i) => ({
          rank: i + 1,
          playerId: `player-${i + 1}`,
          playerName: `Player ${i + 1}`,
          position: 'QB',
          team: 'TEST'
        }))
      }

      const result = service.buildPromptWithHistoricalData([manyPlayerSystem], null)

      // Should only show top 20
      expect(result).toContain('Player 20')
      expect(result).not.toContain('Player 21')
    })
  })

  describe('buildBasicPrompt', () => {
    it('should build basic prompt without historical data', () => {
      const result = service.buildBasicPrompt(mockRankingSystems)

      expect(result).toContain('Analyze the following player rankings')
      expect(result).toContain('consolidated ranking')
      expect(result).toContain('Test Rankings')
      expect(result).toContain('Josh Allen')
      expect(result).not.toContain('HISTORICAL NFL PERFORMANCE DATA')
    })

    it('should handle empty ranking systems', () => {
      const result = service.buildBasicPrompt([])

      expect(result).toContain('Analyze the following player rankings')
      expect(result).not.toContain('Test Rankings')
    })

    it('should format player rankings correctly', () => {
      const result = service.buildBasicPrompt(mockRankingSystems)

      expect(result).toContain('1. Josh Allen (QB - BUF)')
      expect(result).toContain('2. Christian McCaffrey (RB - SF)')
    })
  })

  describe('addHistoricalPerformanceContext', () => {
    it('should include comprehensive performance analysis', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        mockNflData,
        { year: 2024 }
      )

      expect(result).toContain('COMPREHENSIVE HISTORICAL PERFORMANCE ANALYSIS')
      expect(result).toContain('Data includes 1 players across 2024')
      expect(result).toContain('Total season records: 1')
    })

    it('should group players by position', () => {
      const nflDataWithMultiplePositions = {
        ...mockNflData,
        aggregated_season_stats: [
          ...mockNflData.aggregated_season_stats,
          {
            player_name: 'Christian McCaffrey',
            position: 'RB',
            team: 'SF',
            fantasy_points_ppr: 350,
            games: 16,
            rushing_yards: 1500,
            rushing_tds: 15,
            rushing_attempts: 300
          }
        ],
        metadata: {
          ...mockNflData.metadata,
          total_players: 2
        }
      }

      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        nflDataWithMultiplePositions,
        { year: 2024 }
      )

      expect(result).toContain('QB PERFORMANCE METRICS')
      expect(result).toContain('RB PERFORMANCE METRICS')
      expect(result).toContain('Josh Allen (BUF)')
      expect(result).toContain('Christian McCaffrey (SF)')
    })

    it('should show position-specific metrics for QB', () => {
      const result = service.buildPromptWithHistoricalData(
        mockRankingSystems,
        mockNflData,
        { year: 2024 }
      )

      expect(result).toContain('Passing: 4500 yds, 30 TDs, 10 INTs')
      expect(result).toContain('Efficiency:')
    })
  })
})