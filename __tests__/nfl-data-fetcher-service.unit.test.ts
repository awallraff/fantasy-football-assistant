import { NflDataFetcherService } from '@/lib/nfl-data-fetcher-service'

// Mock fetch globally
global.fetch = jest.fn()

describe('NflDataFetcherService', () => {
  let service: NflDataFetcherService
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    service = new NflDataFetcherService()
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
    service.clearCache()
  })

  describe('fetchHistoricalData', () => {
    const mockNflData = {
      aggregated_season_stats: [
        {
          player_name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          fantasy_points_ppr: 400
        }
      ],
      weekly_stats: [],
      metadata: {
        total_players: 1,
        total_aggregated_records: 1,
        years: [2024]
      }
    }

    it('should fetch historical data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNflData
      } as Response)

      const result = await service.fetchHistoricalData()

      expect(result).toEqual(mockNflData)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/nfl-data?'))
      expect(service.getCachedData()).toEqual(mockNflData)
    })

    it('should handle API failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)

      const result = await service.fetchHistoricalData()

      expect(result).toBeNull()
      expect(service.getCachedData()).toBeNull()
    })

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.fetchHistoricalData()

      expect(result).toBeNull()
      expect(service.getCachedData()).toBeNull()
    })

    it('should use correct parameters for data fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNflData
      } as Response)

      await service.fetchHistoricalData({
        year: 2023,
        week: 5,
        positions: ['QB', 'RB']
      })

      const callUrl = mockFetch.mock.calls[0][0] as string
      expect(callUrl).toContain('years=2024') // Always uses 2024 for historical analysis
      expect(callUrl).toContain('positions=QB%2CRB')
      expect(callUrl).toContain('action=extract')
    })
  })

  describe('getPlayerData', () => {
    const mockNflData = {
      aggregated_season_stats: [
        {
          player_name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          fantasy_points_ppr: 400
        },
        {
          player_name: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          fantasy_points_ppr: 350
        }
      ],
      weekly_stats: [
        {
          player_name: 'Lamar Jackson',
          position: 'QB',
          team: 'BAL',
          fantasy_points_ppr: 25
        }
      ]
    }

    beforeEach(() => {
      // Set up cached data
      service['cachedData'] = mockNflData as any
    })

    it('should find player in season stats', () => {
      const result = service.getPlayerData('Josh Allen')

      expect(result).toBeDefined()
      expect(result?.player_name).toBe('Josh Allen')
      expect(result?.position).toBe('QB')
    })

    it('should find player in weekly stats when not in season stats', () => {
      const result = service.getPlayerData('Lamar Jackson')

      expect(result).toBeDefined()
      expect(result?.player_name).toBe('Lamar Jackson')
      expect(result?.position).toBe('QB')
    })

    it('should handle partial name matching', () => {
      const result = service.getPlayerData('allen')

      expect(result).toBeDefined()
      expect(result?.player_name).toBe('Josh Allen')
    })

    it('should return null when no data cached', () => {
      service.clearCache()
      const result = service.getPlayerData('Josh Allen')

      expect(result).toBeNull()
    })

    it('should return null when player not found', () => {
      const result = service.getPlayerData('Unknown Player')

      expect(result).toBeNull()
    })
  })

  describe('getPlayersByPosition', () => {
    const mockNflData = {
      aggregated_season_stats: [
        { player_name: 'Josh Allen', position: 'QB', team: 'BUF' },
        { player_name: 'Lamar Jackson', position: 'QB', team: 'BAL' },
        { player_name: 'Christian McCaffrey', position: 'RB', team: 'SF' }
      ]
    }

    beforeEach(() => {
      service['cachedData'] = mockNflData as any
    })

    it('should return all players of specified position', () => {
      const result = service.getPlayersByPosition('QB')

      expect(result).toHaveLength(2)
      expect(result[0].player_name).toBe('Josh Allen')
      expect(result[1].player_name).toBe('Lamar Jackson')
    })

    it('should return empty array when position not found', () => {
      const result = service.getPlayersByPosition('K')

      expect(result).toHaveLength(0)
    })

    it('should return empty array when no data cached', () => {
      service.clearCache()
      const result = service.getPlayersByPosition('QB')

      expect(result).toHaveLength(0)
    })
  })

  describe('hasHistoricalData', () => {
    it('should return true when historical data is available', () => {
      service['cachedData'] = {
        aggregated_season_stats: [{ player_name: 'Test' }]
      } as any

      expect(service.hasHistoricalData()).toBe(true)
    })

    it('should return false when no data is cached', () => {
      service.clearCache()

      expect(service.hasHistoricalData()).toBe(false)
    })

    it('should return false when cached data has no season stats', () => {
      service['cachedData'] = {
        aggregated_season_stats: []
      } as any

      expect(service.hasHistoricalData()).toBe(false)
    })
  })

  describe('cache management', () => {
    it('should clear cache correctly', () => {
      service['cachedData'] = { some: 'data' } as any

      service.clearCache()

      expect(service.getCachedData()).toBeNull()
    })

    it('should return cached data when available', () => {
      const mockData = { test: 'data' }
      service['cachedData'] = mockData as any

      expect(service.getCachedData()).toEqual(mockData)
    })
  })
})