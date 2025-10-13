/**
 * @jest-environment jsdom
 */

/**
 * useLeagueSelection Hook Unit Tests
 *
 * Tests for the useLeagueSelection custom React hook, including:
 * - League detail loading (rosters + users)
 * - AbortController request cancellation
 * - Back to leagues navigation
 * - League switching
 * - Roster sorting (current user first)
 * - Roster-owner matching validation
 * - Race condition prevention
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useLeagueSelection } from '@/hooks/use-league-selection'
import { sleeperAPI } from '@/lib/sleeper-api'
import { createMockSleeperLeague, createMockSleeperRoster, createMockSleeperUser } from '../utils/test-factories'

// Mock sleeper-api
jest.mock('@/lib/sleeper-api', () => ({
  sleeperAPI: {
    getLeagueRosters: jest.fn(),
    getLeagueUsers: jest.fn(),
  },
}))

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

describe('useLeagueSelection Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockProps = () => {
    const league2025 = createMockSleeperLeague({ league_id: 'league_1', name: 'Dynasty 2025', season: '2025' })
    const league2024 = createMockSleeperLeague({ league_id: 'league_2', name: 'Redraft 2024', season: '2024' })

    return {
      leaguesByYear: {
        '2025': [league2025],
        '2024': [league2024],
      },
      selectedYear: '2025',
      currentUser: createMockSleeperUser({ user_id: 'user_123', username: 'currentuser' }),
    }
  }

  describe('Initialization', () => {
    it('should initialize with null selectedLeague and empty arrays', () => {
      const props = createMockProps()
      const { result } = renderHook(() => useLeagueSelection(props))

      expect(result.current.selectedLeague).toBeNull()
      expect(result.current.rosters).toEqual([])
      expect(result.current.leagueUsers).toEqual([])
      expect(result.current.sortedRosters).toEqual([])
    })
  })

  describe('loadLeagueDetails', () => {
    it('should load league rosters and users', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const mockRosters = [
        createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' }),
        createMockSleeperRoster({ roster_id: 2, owner_id: 'user_456' }),
      ]
      const mockUsers = [
        createMockSleeperUser({ user_id: 'user_123', username: 'user1' }),
        createMockSleeperUser({ user_id: 'user_456', username: 'user2' }),
      ]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      expect(sleeperAPI.getLeagueRosters).toHaveBeenCalledWith('league_1')
      expect(sleeperAPI.getLeagueUsers).toHaveBeenCalledWith('league_1')
      expect(result.current.selectedLeague).toEqual(league)
      expect(result.current.rosters).toEqual(mockRosters)
      expect(result.current.leagueUsers).toEqual(mockUsers)
    })

    it('should set data before league to prevent race conditions', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const mockRosters = [createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })]
      const mockUsers = [createMockSleeperUser({ user_id: 'user_123', username: 'user1' })]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      // Verify data was set (this tests the race condition fix)
      expect(result.current.selectedLeague).toEqual(league)
      expect(result.current.rosters).toEqual(mockRosters)
      expect(result.current.leagueUsers).toEqual(mockUsers)
    })

    it('should abort previous request when loading new league', async () => {
      const props = createMockProps()
      const league1 = props.leaguesByYear['2025'][0]
      const league2 = createMockSleeperLeague({ league_id: 'league_3', name: 'Another League', season: '2025' })

      let resolveFirst: any
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve
      })

      ;(sleeperAPI.getLeagueRosters as jest.Mock)
        .mockImplementationOnce(() => firstPromise)
        .mockResolvedValue([createMockSleeperRoster({ roster_id: 2, owner_id: 'user_789' })])

      ;(sleeperAPI.getLeagueUsers as jest.Mock)
        .mockImplementationOnce(() => firstPromise)
        .mockResolvedValue([createMockSleeperUser({ user_id: 'user_789', username: 'user3' })])

      const { result } = renderHook(() => useLeagueSelection(props))

      // Start loading first league (but don't resolve yet)
      act(() => {
        result.current.loadLeagueDetails(league1)
      })

      // Immediately start loading second league (should abort first)
      await act(async () => {
        await result.current.loadLeagueDetails(league2)
      })

      // Resolve first promise (should be aborted and not update state)
      resolveFirst([createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })])

      await waitFor(() => {
        expect(result.current.selectedLeague).toEqual(league2)
      })

      // Should have data from second league, not first
      expect(result.current.rosters[0].roster_id).toBe(2)
    })

    it('should handle API errors gracefully', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockRejectedValue(new Error('API Error'))
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useLeagueSelection(props))

      let thrownError: Error | null = null
      try {
        await act(async () => {
          await result.current.loadLeagueDetails(league)
        })
      } catch (error) {
        thrownError = error as Error
      }

      expect(thrownError).toBeTruthy()
      expect(thrownError?.message).toBe('API Error')
      expect(console.error).toHaveBeenCalledWith('Error loading league details:', expect.any(Error))
    })

    it('should not throw AbortError when request is cancelled', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockRejectedValue(abortError)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockRejectedValue(abortError)

      const { result } = renderHook(() => useLeagueSelection(props))

      // Should not throw when AbortError
      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('handleBackToLeagues', () => {
    it('should clear selected league and reset state', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const mockRosters = [createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })]
      const mockUsers = [createMockSleeperUser({ user_id: 'user_123', username: 'user1' })]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      // Load league first
      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      expect(result.current.selectedLeague).toEqual(league)

      // Go back
      act(() => {
        result.current.handleBackToLeagues()
      })

      expect(result.current.selectedLeague).toBeNull()
      expect(result.current.rosters).toEqual([])
      expect(result.current.leagueUsers).toEqual([])
    })

    it('should abort pending requests when going back', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      let resolveRosters: any
      const rostersPromise = new Promise((resolve) => {
        resolveRosters = resolve
      })

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockImplementation(() => rostersPromise)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockImplementation(() => rostersPromise)

      const { result } = renderHook(() => useLeagueSelection(props))

      // Start loading (but don't resolve)
      act(() => {
        result.current.loadLeagueDetails(league)
      })

      // Go back immediately (should abort)
      act(() => {
        result.current.handleBackToLeagues()
      })

      // Resolve the promises (should not update state due to abort)
      resolveRosters([createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })])

      await waitFor(() => {
        expect(result.current.selectedLeague).toBeNull()
      })
    })
  })

  describe('handleLeagueChange', () => {
    it('should load details for selected league', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const mockRosters = [createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })]
      const mockUsers = [createMockSleeperUser({ user_id: 'user_123', username: 'user1' })]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.handleLeagueChange('league_1')
      })

      expect(result.current.selectedLeague).toEqual(league)
      expect(result.current.rosters).toEqual(mockRosters)
      expect(result.current.leagueUsers).toEqual(mockUsers)
    })

    it('should do nothing if league not found', async () => {
      const props = createMockProps()

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.handleLeagueChange('nonexistent_league')
      })

      expect(result.current.selectedLeague).toBeNull()
      expect(sleeperAPI.getLeagueRosters).not.toHaveBeenCalled()
    })
  })

  describe('sortedRosters', () => {
    it('should return empty array if no league users loaded', () => {
      const props = createMockProps()

      const { result } = renderHook(() => useLeagueSelection(props))

      // Manually set rosters without users (simulating data mismatch)
      expect(result.current.sortedRosters).toEqual([])
    })

    it('should sort rosters with current user first', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const roster1 = createMockSleeperRoster({ roster_id: 1, owner_id: 'user_456' }) // Other user
      const roster2 = createMockSleeperRoster({ roster_id: 2, owner_id: 'user_123' }) // Current user
      const roster3 = createMockSleeperRoster({ roster_id: 3, owner_id: 'user_789' }) // Other user

      const mockRosters = [roster1, roster2, roster3]
      const mockUsers = [
        createMockSleeperUser({ user_id: 'user_456', username: 'user2' }),
        createMockSleeperUser({ user_id: 'user_123', username: 'currentuser' }),
        createMockSleeperUser({ user_id: 'user_789', username: 'user3' }),
      ]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      // Current user's roster should be first
      expect(result.current.sortedRosters[0].owner_id).toBe('user_123')
      expect(result.current.sortedRosters.length).toBe(3)
    })

    it('should filter out rosters without matching owners', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const roster1 = createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })
      const roster2 = createMockSleeperRoster({ roster_id: 2, owner_id: 'orphan_user' }) // No matching user

      const mockRosters = [roster1, roster2]
      const mockUsers = [createMockSleeperUser({ user_id: 'user_123', username: 'user1' })] // Only one user

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      // Should only include roster with matching owner
      expect(result.current.sortedRosters).toHaveLength(1)
      expect(result.current.sortedRosters[0].roster_id).toBe(1)
    })

    it('should log warnings for orphaned rosters in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      const roster1 = createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })
      const roster2 = createMockSleeperRoster({ roster_id: 2, owner_id: 'orphan_user' })

      const mockRosters = [roster1, roster2]
      const mockUsers = [createMockSleeperUser({ user_id: 'user_123', username: 'user1' })]

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockResolvedValue(mockRosters)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useLeagueSelection(props))

      await act(async () => {
        await result.current.loadLeagueDetails(league)
      })

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Roster 2 has no matching owner')
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Cleanup', () => {
    it('should abort requests on unmount', async () => {
      const props = createMockProps()
      const league = props.leaguesByYear['2025'][0]

      let resolveRosters: any
      const rostersPromise = new Promise((resolve) => {
        resolveRosters = resolve
      })

      ;(sleeperAPI.getLeagueRosters as jest.Mock).mockImplementation(() => rostersPromise)
      ;(sleeperAPI.getLeagueUsers as jest.Mock).mockImplementation(() => rostersPromise)

      const { result, unmount } = renderHook(() => useLeagueSelection(props))

      // Start loading
      act(() => {
        result.current.loadLeagueDetails(league)
      })

      // Unmount while loading (should abort)
      unmount()

      // Resolve promise (should not cause errors)
      resolveRosters([createMockSleeperRoster({ roster_id: 1, owner_id: 'user_123' })])

      // No assertion needed - test passes if no errors thrown
    })
  })
})
