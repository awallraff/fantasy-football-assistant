import { AIResponseParserService } from '@/lib/ai-response-parser-service'

describe('AIResponseParserService', () => {
  let service: AIResponseParserService

  beforeEach(() => {
    service = new AIResponseParserService()
  })

  describe('parseAIResponse', () => {
    it('should parse enhanced format with position and team', () => {
      const aiResponse = `1. Josh Allen (QB - BUF) - Analysis: Elite dual-threat quarterback with 25.5 PPR/game projection.
2. Christian McCaffrey (RB - SF) - Analysis: Workhorse back with 22.8 PPR/game potential.`

      const result = service.parseAIResponse(aiResponse)

      expect(result).toHaveLength(2)
      
      // First player
      expect(result[0]).toEqual({
        rank: 1,
        playerId: 'ai-josh-allen-qb-buf-1',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        projectedPoints: 433.5, // 25.5 * 17 for season
        tier: 1,
        notes: 'Elite dual-threat quarterback with 25.5 PPR/game projection.'
      })
      
      // Second player
      expect(result[1]).toEqual({
        rank: 2,
        playerId: 'ai-christian-mccaffrey-rb-sf-2',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        projectedPoints: 387.6, // 22.8 * 17 for season
        tier: 1,
        notes: 'Workhorse back with 22.8 PPR/game potential.'
      })
    })

    it('should handle weekly projections correctly', () => {
      const aiResponse = `1. Josh Allen (QB - BUF) - Analysis: Top weekly play with 25.5 PPR/game projection.`

      const result = service.parseAIResponse(aiResponse, 5) // Week 5

      expect(result[0].projectedPoints).toBe(25.5) // Should not multiply by 17 for weekly
    })

    it('should fallback to basic format when enhanced format fails', () => {
      const aiResponse = `1. Josh Allen - Analysis: Elite quarterback option.
2. Christian McCaffrey - Analysis: Top running back.`

      const result = service.parseAIResponse(aiResponse)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        rank: 1,
        playerId: 'ai-josh-allen-fallback-1',
        playerName: 'Josh Allen',
        position: 'N/A',
        team: 'N/A',
        notes: 'Elite quarterback option.'
      })
    })

    it('should handle mixed format responses', () => {
      const aiResponse = `1. Josh Allen (QB - BUF) - Analysis: Elite dual-threat quarterback.
2. Christian McCaffrey - Analysis: Top running back.`

      const result = service.parseAIResponse(aiResponse)

      expect(result).toHaveLength(2)
      expect(result[0].position).toBe('QB')
      expect(result[0].team).toBe('BUF')
      expect(result[1].position).toBe('N/A')
      expect(result[1].team).toBe('N/A')
    })

    it('should handle responses without projected points', () => {
      const aiResponse = `1. Josh Allen (QB - BUF) - Analysis: Elite quarterback without specific projection.`

      const result = service.parseAIResponse(aiResponse)

      expect(result[0].projectedPoints).toBeUndefined()
      expect(result[0].tier).toBeUndefined()
    })

    it('should skip invalid lines', () => {
      const aiResponse = `Invalid line without proper format
1. Josh Allen (QB - BUF) - Analysis: Elite quarterback.
Another invalid line
2. Christian McCaffrey (RB - SF) - Analysis: Top running back.`

      const result = service.parseAIResponse(aiResponse)

      expect(result).toHaveLength(2)
      expect(result[0].playerName).toBe('Josh Allen')
      expect(result[1].playerName).toBe('Christian McCaffrey')
    })

    it('should handle empty response', () => {
      const result = service.parseAIResponse('')

      expect(result).toHaveLength(0)
    })
  })

  describe('calculateTier', () => {
    it('should calculate seasonal tiers correctly', () => {
      // Access private method for testing
      const calculateTier = (service as any).calculateTier

      // QB tiers (seasonal) - [300, 280, 260, 240, 220]
      expect(calculateTier('QB', 320)).toBe(1) // Above 300
      expect(calculateTier('QB', 290)).toBe(2) // Between 280-300
      expect(calculateTier('QB', 250)).toBe(4) // Between 240-260 (tier 4)
      expect(calculateTier('QB', 100)).toBe(6) // Below all tiers

      // RB tiers (seasonal)
      expect(calculateTier('RB', 300)).toBe(1) // Above 280
      expect(calculateTier('RB', 260)).toBe(2) // Between 250-280
      expect(calculateTier('RB', 100)).toBe(6) // Below all tiers

      // TE tiers (seasonal)
      expect(calculateTier('TE', 200)).toBe(1) // Above 180
      expect(calculateTier('TE', 160)).toBe(2) // Between 150-180
      expect(calculateTier('TE', 50)).toBe(6)  // Below all tiers
    })

    it('should calculate weekly tiers correctly', () => {
      const calculateTier = (service as any).calculateTier

      // QB tiers (weekly) - [20, 18, 16, 14, 12]
      expect(calculateTier('QB', 22, true)).toBe(1) // Above 20
      expect(calculateTier('QB', 19, true)).toBe(2) // Between 18-20
      expect(calculateTier('QB', 15, true)).toBe(4) // Between 14-16 (tier 4)
      expect(calculateTier('QB', 10, true)).toBe(6) // Below all tiers

      // RB tiers (weekly)
      expect(calculateTier('RB', 20, true)).toBe(1) // Above 18
      expect(calculateTier('RB', 17, true)).toBe(2) // Between 16-18
      expect(calculateTier('RB', 8, true)).toBe(6)  // Below all tiers
    })

    it('should handle unknown positions', () => {
      const calculateTier = (service as any).calculateTier

      // Should default to WR tier breakpoints
      expect(calculateTier('K', 300)).toBe(1) // Uses WR seasonal tiers
      expect(calculateTier('K', 20, true)).toBe(1) // Uses WR weekly tiers
    })
  })

  describe('validateRanking', () => {
    it('should validate complete ranking', () => {
      const validRanking = {
        rank: 1,
        playerId: 'player-1',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF'
      }

      expect(service.validateRanking(validRanking)).toBe(true)
    })

    it('should reject ranking with missing required fields', () => {
      const incompleteRankings = [
        { playerId: 'player-1', playerName: 'Josh Allen', position: 'QB', team: 'BUF' }, // Missing rank
        { rank: 1, playerName: 'Josh Allen', position: 'QB', team: 'BUF' }, // Missing playerId
        { rank: 1, playerId: 'player-1', position: 'QB', team: 'BUF' }, // Missing playerName
        { rank: 1, playerId: 'player-1', playerName: 'Josh Allen', team: 'BUF' }, // Missing position
        { rank: 1, playerId: 'player-1', playerName: 'Josh Allen', position: 'QB' } // Missing team
      ]

      incompleteRankings.forEach(ranking => {
        expect(service.validateRanking(ranking as any)).toBe(false)
      })
    })

    it('should accept ranking with optional fields undefined', () => {
      const rankingWithOptionalFields = {
        rank: 1,
        playerId: 'player-1',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        projectedPoints: undefined,
        tier: undefined,
        notes: undefined
      }

      expect(service.validateRanking(rankingWithOptionalFields)).toBe(true)
    })
  })

  describe('sortAndValidateRankings', () => {
    it('should sort rankings by rank', () => {
      const unsortedRankings = [
        { rank: 3, playerId: '3', playerName: 'Player 3', position: 'RB', team: 'SF' },
        { rank: 1, playerId: '1', playerName: 'Player 1', position: 'QB', team: 'BUF' },
        { rank: 2, playerId: '2', playerName: 'Player 2', position: 'WR', team: 'MIN' }
      ]

      const result = service.sortAndValidateRankings(unsortedRankings)

      expect(result[0].playerName).toBe('Player 1')
      expect(result[1].playerName).toBe('Player 2')
      expect(result[2].playerName).toBe('Player 3')
    })

    it('should ensure sequential ranking', () => {
      const gappedRankings = [
        { rank: 5, playerId: '1', playerName: 'Player 1', position: 'QB', team: 'BUF' },
        { rank: 10, playerId: '2', playerName: 'Player 2', position: 'RB', team: 'SF' },
        { rank: 2, playerId: '3', playerName: 'Player 3', position: 'WR', team: 'MIN' }
      ]

      const result = service.sortAndValidateRankings(gappedRankings)

      expect(result[0].rank).toBe(1) // Player 3 (originally rank 2)
      expect(result[1].rank).toBe(2) // Player 1 (originally rank 5)
      expect(result[2].rank).toBe(3) // Player 2 (originally rank 10)
    })

    it('should handle empty array', () => {
      const result = service.sortAndValidateRankings([])

      expect(result).toHaveLength(0)
    })
  })
})