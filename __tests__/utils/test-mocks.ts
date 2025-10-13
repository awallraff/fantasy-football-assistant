/**
 * Test Mocks
 *
 * Centralized mock implementations for external APIs and services.
 * Use these to avoid actual API calls during tests.
 */

/**
 * Mock fetch responses for Sleeper API
 */
export const mockSleeperAPIResponses = {
  // Mock successful user fetch
  getUserSuccess: (username: string) => ({
    user_id: '123456789',
    username,
    display_name: 'Test User',
    avatar: 'abc123',
  }),

  // Mock user not found
  getUserNotFound: () => null,

  // Mock leagues response
  getLeaguesSuccess: (userId: string, season: string) => [
    {
      league_id: 'league1',
      name: 'Dynasty League 2024',
      season,
      season_type: 'regular',
      status: 'in_season',
      sport: 'nfl',
      total_rosters: 12,
      settings: {
        num_teams: 12,
        playoff_teams: 6,
      },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'FLEX'],
      scoring_settings: {
        pass_yd: 0.04,
        pass_td: 4,
        rec: 1,
      },
    },
    {
      league_id: 'league2',
      name: 'Redraft League 2024',
      season,
      season_type: 'regular',
      status: 'in_season',
      sport: 'nfl',
      total_rosters: 10,
      settings: {
        num_teams: 10,
        playoff_teams: 4,
      },
      roster_positions: ['QB', 'RB', 'WR', 'TE', 'FLEX'],
      scoring_settings: {
        pass_yd: 0.04,
        pass_td: 6,
        rec: 1,
      },
    },
  ],

  // Mock empty leagues (no leagues for season)
  getLeaguesEmpty: () => [],

  // Mock rosters response
  getRostersSuccess: (leagueId: string) => [
    {
      roster_id: 1,
      owner_id: '123456789',
      players: ['4866', '7564', '8111'],
      starters: ['4866', '7564'],
      reserve: [],
      taxi: [],
      settings: {
        wins: 8,
        losses: 5,
        ties: 0,
        fpts: 1456.75,
        fpts_against: 1340.25,
        fpts_decimal: 0.75,
        fpts_against_decimal: 0.25,
      },
    },
    {
      roster_id: 2,
      owner_id: '987654321',
      players: ['2749', '6783', '9226'],
      starters: ['2749', '6783'],
      reserve: [],
      taxi: [],
      settings: {
        wins: 10,
        losses: 3,
        ties: 0,
        fpts: 1689.50,
        fpts_against: 1520.30,
        fpts_decimal: 0.50,
        fpts_against_decimal: 0.30,
      },
    },
  ],

  // Mock all players response (simplified)
  getAllPlayersSuccess: () => ({
    '4866': {
      player_id: '4866',
      first_name: 'Patrick',
      last_name: 'Mahomes',
      full_name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      age: 28,
      years_exp: 7,
      active: true,
      status: 'Active',
      fantasy_positions: ['QB'],
      number: 15,
    },
    '7564': {
      player_id: '7564',
      first_name: 'Christian',
      last_name: 'McCaffrey',
      full_name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      age: 27,
      years_exp: 7,
      active: true,
      status: 'Active',
      fantasy_positions: ['RB'],
      number: 23,
    },
    '8111': {
      player_id: '8111',
      first_name: 'Justin',
      last_name: 'Jefferson',
      full_name: 'Justin Jefferson',
      position: 'WR',
      team: 'MIN',
      age: 24,
      years_exp: 4,
      active: true,
      status: 'Active',
      fantasy_positions: ['WR'],
      number: 18,
    },
  }),

  // Mock transactions response
  getTransactionsSuccess: (leagueId: string, week: number) => [
    {
      transaction_id: 'txn123',
      type: 'trade',
      status: 'complete',
      leg: 1,
      created: Date.now() - 86400000, // 1 day ago
      roster_ids: [1, 2],
      settings: null,
      consenter_ids: [1, 2],
      draft_picks: [],
      adds: { '4866': 2 },
      drops: { '7564': 1 },
    },
  ],
}

/**
 * Mock global fetch function
 */
export function mockFetch(responses: Record<string, any>) {
  return jest.fn((url: string) => {
    const urlString = url.toString()

    // Match URL patterns and return appropriate mock responses
    if (urlString.includes('/user/')) {
      const username = urlString.split('/user/')[1]
      return Promise.resolve({
        ok: true,
        json: async () => responses.user || mockSleeperAPIResponses.getUserSuccess(username),
      })
    }

    if (urlString.includes('/leagues/')) {
      return Promise.resolve({
        ok: true,
        json: async () => responses.leagues || mockSleeperAPIResponses.getLeaguesSuccess('123', '2024'),
      })
    }

    if (urlString.includes('/rosters')) {
      return Promise.resolve({
        ok: true,
        json: async () => responses.rosters || mockSleeperAPIResponses.getRostersSuccess('league123'),
      })
    }

    if (urlString.includes('/players/nfl')) {
      return Promise.resolve({
        ok: true,
        json: async () => responses.players || mockSleeperAPIResponses.getAllPlayersSuccess(),
      })
    }

    if (urlString.includes('/transactions/')) {
      return Promise.resolve({
        ok: true,
        json: async () => responses.transactions || mockSleeperAPIResponses.getTransactionsSuccess('league123', 1),
      })
    }

    // Default: return empty response
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    })
  }) as jest.Mock
}

/**
 * Mock fetch that returns errors
 */
export function mockFetchError(statusCode: number = 500, message: string = 'Internal Server Error') {
  return jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: statusCode,
      statusText: message,
      json: async () => ({ error: message }),
    })
  ) as jest.Mock
}

/**
 * Mock fetch that times out
 */
export function mockFetchTimeout(delay: number = 5000) {
  return jest.fn(
    () =>
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), delay)
      })
  ) as jest.Mock
}

/**
 * Mock localStorage for SSR-safe tests
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

/**
 * Mock IndexedDB for cache tests
 */
export function mockIndexedDB() {
  const databases: Record<string, any> = {}

  return {
    open: jest.fn((name: string) => ({
      onsuccess: null,
      onerror: null,
      result: {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            get: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
          })),
        })),
      },
    })),
    deleteDatabase: jest.fn(),
  }
}

/**
 * Mock console methods (to suppress logs during tests)
 */
export function mockConsole() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}
