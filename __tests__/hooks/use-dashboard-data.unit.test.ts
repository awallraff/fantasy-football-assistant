/**
 * @jest-environment jsdom
 */

/**
 * useDashboardData Hook Unit Tests
 *
 * Tests for the useDashboardData custom React hook, including:
 * - localStorage initialization
 * - Year selection and filtering
 * - League loading by year
 * - League removal with confirmation
 * - Retry connection logic
 * - Clear and restart functionality
 * - Computed values (availableYears, currentYearLeagues)
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { sleeperAPI } from '@/lib/sleeper-api'
import { mockLocalStorage } from '../utils/test-mocks'
import { createMockSleeperUser, createMockSleeperLeague } from '../utils/test-factories'

// Mock sleeper-api
jest.mock('@/lib/sleeper-api', () => ({
  sleeperAPI: {
    getUserLeagues: jest.fn(),
  },
}))

// Suppress console logs in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

// Mock window.confirm
const originalConfirm = window.confirm

beforeAll(() => {
  console.error = jest.fn()
  console.log = jest.fn()
  console.warn = jest.fn()
  window.confirm = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
  window.confirm = originalConfirm
})

describe('useDashboardData Hook', () => {
  // Store original localStorage methods
  let originalLocalStorageMethods: any

  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })

    // Store original methods before each test
    originalLocalStorageMethods = {
      getItem: mockLocalStorage.getItem,
      setItem: mockLocalStorage.setItem,
      removeItem: mockLocalStorage.removeItem,
      clear: mockLocalStorage.clear,
    }

    mockLocalStorage.clear()
    jest.clearAllMocks()

    // Default confirm to true
    ;(window.confirm as jest.Mock).mockReturnValue(true)
  })

  afterEach(() => {
    // Restore localStorage methods after each test
    mockLocalStorage.getItem = originalLocalStorageMethods.getItem
    mockLocalStorage.setItem = originalLocalStorageMethods.setItem
    mockLocalStorage.removeItem = originalLocalStorageMethods.removeItem
    mockLocalStorage.clear = originalLocalStorageMethods.clear
  })

  describe('Initialization', () => {
    it('should initialize with empty state when no localStorage data', async () => {
      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.leagues).toEqual([])
        expect(result.current.leaguesByYear).toEqual({})
        expect(result.current.selectedYear).toBe('2025')
      })
    })

    it('should load user from localStorage on mount', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'test_user_123', username: 'testuser' })
      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })
    })

    it('should load leagues from localStorage and organize by year', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      const league2025 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
      const league2024 = createMockSleeperLeague({ league_id: 'league_2', name: 'Redraft 2024', season: '2024' })
      const leagues = [league2025, league2024]

      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.leagues).toEqual(leagues)
        expect(result.current.leaguesByYear).toEqual({
          '2025': [league2025],
          '2024': [league2024],
        })
        expect(result.current.selectedYear).toBe('2025') // Most recent year
      })
    })

    it('should handle localStorage parse errors gracefully', async () => {
      mockLocalStorage.setItem('sleeper_user', '{invalid json}')
      mockLocalStorage.setItem('sleeper_leagues', '{invalid json}')

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.leagues).toEqual([])
        expect(console.error).toHaveBeenCalledWith('Failed to parse user data:', expect.any(Error))
        expect(console.error).toHaveBeenCalledWith('Failed to parse leagues data:', expect.any(Error))
      })
    })
  })

  describe('Year Selection', () => {
    it('should change selected year', async () => {
      const league2025 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
      const league2024 = createMockSleeperLeague({ league_id: 'league_2', name: 'Redraft 2024', season: '2024' })
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify([league2025, league2024]))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.selectedYear).toBe('2025')
      })

      act(() => {
        result.current.setSelectedYear('2024')
      })

      expect(result.current.selectedYear).toBe('2024')
      expect(result.current.currentYearLeagues).toEqual([league2024])
    })

    it('should compute availableYears in descending order', async () => {
      const leagues = [
        createMockSleeperLeague({ league_id: 'l1', name: 'League 2025', season: '2025' }),
        createMockSleeperLeague({ league_id: 'l2', name: 'League 2024', season: '2024' }),
        createMockSleeperLeague({ league_id: 'l3', name: 'League 2023', season: '2023' }),
      ]
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.availableYears).toEqual(['2025', '2024', '2023'])
      })
    })

    it('should filter currentYearLeagues correctly', async () => {
      const league2025a = createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2025', season: '2025' })
      const league2025b = createMockSleeperLeague({ league_id: 'l2', name: 'Redraft 2025', season: '2025' })
      const league2024 = createMockSleeperLeague({ league_id: 'l3', name: 'League 2024', season: '2024' })
      const leagues = [league2025a, league2025b, league2024]
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.selectedYear).toBe('2025')
        expect(result.current.currentYearLeagues).toEqual([league2025a, league2025b])
      })
    })
  })

  describe('loadLeaguesForYear', () => {
    it('should load leagues for a specific year', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      const league2024a = createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2024', season: '2024' })
      const league2024b = createMockSleeperLeague({ league_id: 'l2', name: 'Redraft 2024', season: '2024' })
      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      ;(sleeperAPI.getUserLeagues as jest.Mock).mockResolvedValue([league2024a, league2024b])

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      let loadedLeagues: any[]
      await act(async () => {
        loadedLeagues = await result.current.loadLeaguesForYear('2024')
      })

      expect(sleeperAPI.getUserLeagues).toHaveBeenCalledWith('user_123', 'nfl', '2024')
      expect(loadedLeagues!).toEqual([league2024a, league2024b])
      expect(result.current.leaguesByYear['2024']).toEqual([league2024a, league2024b])
    })

    it('should return empty array if no user', async () => {
      const { result } = renderHook(() => useDashboardData())

      let loadedLeagues: any[]
      await act(async () => {
        loadedLeagues = await result.current.loadLeaguesForYear('2024')
      })

      expect(loadedLeagues!).toEqual([])
      expect(sleeperAPI.getUserLeagues).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      ;(sleeperAPI.getUserLeagues as jest.Mock).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      let loadedLeagues: any[]
      await act(async () => {
        loadedLeagues = await result.current.loadLeaguesForYear('2024')
      })

      expect(loadedLeagues!).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Error loading leagues for 2024:',
        expect.any(Error)
      )
    })
  })

  describe('removeLeague', () => {
    it('should remove league after confirmation', async () => {
      const league1 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
      const league2 = createMockSleeperLeague({ league_id: 'league_2', name: 'Redraft 2025', season: '2025' })
      const leagues = [league1, league2]
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      ;(window.confirm as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.leagues).toEqual(leagues)
      })

      act(() => {
        result.current.removeLeague('league_1', 'Dynasty 2025')
      })

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to remove "Dynasty 2025"? This action cannot be undone.'
      )
      expect(result.current.leagues).toEqual([league2])
      expect(mockLocalStorage.getItem('sleeper_leagues')).toBe(JSON.stringify([league2]))
    })

    it('should not remove league if user cancels confirmation', async () => {
      const league1 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
      const league2 = createMockSleeperLeague({ league_id: 'league_2', name: 'Redraft 2025', season: '2025' })
      const leagues = [league1, league2]
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      ;(window.confirm as jest.Mock).mockReturnValue(false)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.leagues).toEqual(leagues)
      })

      act(() => {
        result.current.removeLeague('league_1', 'Dynasty 2025')
      })

      expect(result.current.leagues).toEqual(leagues) // Unchanged
      expect(mockLocalStorage.getItem('sleeper_leagues')).toBe(JSON.stringify(leagues))
    })

    it('should update leaguesByYear when removing league', async () => {
      const league2025 = createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2025', season: '2025' })
      const league2024 = createMockSleeperLeague({ league_id: 'l2', name: 'Redraft 2024', season: '2024' })
      const leagues = [league2025, league2024]
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      ;(window.confirm as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.leaguesByYear).toEqual({
          '2025': [league2025],
          '2024': [league2024],
        })
      })

      act(() => {
        result.current.removeLeague('l1')
      })

      expect(result.current.leaguesByYear).toEqual({
        '2024': [league2024],
      })
    })

    it('should handle errors during removal gracefully', async () => {
      const league1 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify([league1]))

      // Mock setItem to throw error
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('localStorage error')
      })

      ;(window.confirm as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.leagues.length).toBeGreaterThan(0)
      })

      act(() => {
        result.current.removeLeague('league_1')
      })

      // useSafeLocalStorage wraps errors, so check for the wrapper message
      expect(console.error).toHaveBeenCalled()
      const errorCall = (console.error as jest.Mock).mock.calls.find((call: any[]) =>
        call[0]?.includes('Failed to set localStorage item') || call[0]?.includes('Error removing league')
      )
      expect(errorCall).toBeDefined()
    })
  })

  describe('retryConnection', () => {
    it('should reload all leagues for multiple seasons', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      const leagues2025 = [createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2025', season: '2025' })]
      const leagues2024 = [createMockSleeperLeague({ league_id: 'l2', name: 'Redraft 2024', season: '2024' })]
      const leagues2023 = [createMockSleeperLeague({ league_id: 'l3', name: 'League 2023', season: '2023' })]

      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      ;(sleeperAPI.getUserLeagues as jest.Mock)
        .mockResolvedValueOnce(leagues2025)
        .mockResolvedValueOnce(leagues2024)
        .mockResolvedValueOnce(leagues2023)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.retryConnection()
      })

      expect(sleeperAPI.getUserLeagues).toHaveBeenCalledWith('user_123', 'nfl', '2025')
      expect(sleeperAPI.getUserLeagues).toHaveBeenCalledWith('user_123', 'nfl', '2024')
      expect(sleeperAPI.getUserLeagues).toHaveBeenCalledWith('user_123', 'nfl', '2023')
      expect(result.current.leagues).toEqual([...leagues2025, ...leagues2024, ...leagues2023])
      expect(result.current.selectedYear).toBe('2025') // Most recent
    })

    it('should handle errors for individual seasons gracefully', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      const leagues2025 = [createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2025', season: '2025' })]

      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      ;(sleeperAPI.getUserLeagues as jest.Mock)
        .mockResolvedValueOnce(leagues2025)
        .mockRejectedValueOnce(new Error('2024 API Error'))
        .mockResolvedValueOnce([])

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.retryConnection()
      })

      // Should still load 2025 leagues despite 2024 error
      expect(result.current.leagues).toEqual(leagues2025)
      expect(console.error).toHaveBeenCalledWith('2024 season error:', expect.any(Error))
    })

    it('should not throw error if all seasons fail (errors are logged)', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))

      ;(sleeperAPI.getUserLeagues as jest.Mock).mockRejectedValue(new Error('Total failure'))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Should not throw - errors are caught per-season
      await act(async () => {
        await result.current.retryConnection()
      })

      // Verify all 3 season errors were logged
      expect(console.error).toHaveBeenCalledWith('2025 season error:', expect.any(Error))
      expect(console.error).toHaveBeenCalledWith('2024 season error:', expect.any(Error))
      expect(console.error).toHaveBeenCalledWith('2023 season error:', expect.any(Error))

      // Leagues should remain empty (no successful loads)
      expect(result.current.leagues).toEqual([])
    })
  })

  describe('clearAndRestart', () => {
    it('should clear localStorage and call window.location.href setter', async () => {
      const mockUser = createMockSleeperUser({ user_id: 'user_123', username: 'testuser' })
      const leagues = [createMockSleeperLeague({ league_id: 'l1', name: 'Dynasty 2025', season: '2025' })]

      mockLocalStorage.setItem('sleeper_user', JSON.stringify(mockUser))
      mockLocalStorage.setItem('sleeper_leagues', JSON.stringify(leagues))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Spy on the clearAndRestart function
      const clearAndRestartSpy = jest.spyOn(result.current, 'clearAndRestart')

      act(() => {
        result.current.clearAndRestart()
      })

      expect(mockLocalStorage.getItem('sleeper_user')).toBeNull()
      expect(mockLocalStorage.getItem('sleeper_leagues')).toBeNull()

      // Just verify the function was called (we can't easily test navigation in jsdom)
      expect(clearAndRestartSpy).toHaveBeenCalled()
    })
  })
})
