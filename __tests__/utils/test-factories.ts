/**
 * Test Data Factories
 *
 * Centralized factory functions for creating test data objects.
 * Use these to generate consistent, realistic test data across all tests.
 */

import { SleeperPlayer, SleeperRoster, SleeperUser, SleeperLeague, SleeperTransaction } from '@/types/sleeper'

/**
 * Create a mock Sleeper user
 */
export function createMockSleeperUser(overrides?: Partial<SleeperUser>): SleeperUser {
  return {
    user_id: '123456789',
    username: 'wallreezy',
    display_name: 'Wallreezy',
    avatar: 'abc123',
    ...overrides,
  }
}

/**
 * Create a mock Sleeper league
 */
export function createMockSleeperLeague(overrides?: Partial<SleeperLeague>): SleeperLeague {
  return {
    league_id: 'league123',
    name: 'Test Dynasty League',
    season: '2024',
    season_type: 'regular',
    status: 'in_season',
    sport: 'nfl',
    settings: {
      num_teams: 12,
      playoff_teams: 6,
      playoff_week_start: 15,
      league_average_match: 0,
      waiver_type: 2,
      waiver_clear_days: 2,
      waiver_day_of_week: 3,
      daily_waivers: 0,
      playoff_type: 2,
      type: 2,
      best_ball: 0,
      disable_trades: 0,
      trade_deadline: 10,
      trade_review_days: 1,
      reserve_allow_dnr: 0,
      reserve_allow_out: 1,
      reserve_allow_sus: 1,
      reserve_allow_cov: 1,
      taxi_years: 3,
      taxi_slots: 5,
      reserve_slots: 3,
      capacity_override: 0,
    },
    roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX', 'SUPER_FLEX', 'BN', 'BN', 'BN', 'BN', 'BN', 'TAXI', 'TAXI', 'TAXI', 'TAXI', 'TAXI', 'IR', 'IR', 'IR'],
    scoring_settings: {
      pass_yd: 0.04,
      pass_td: 4,
      pass_int: -2,
      rush_yd: 0.1,
      rush_td: 6,
      rec: 1,
      rec_yd: 0.1,
      rec_td: 6,
    },
    total_rosters: 12,
    ...overrides,
  }
}

/**
 * Create a mock Sleeper roster
 */
export function createMockSleeperRoster(overrides?: Partial<SleeperRoster>): SleeperRoster {
  return {
    roster_id: 1,
    owner_id: '123456789',
    players: ['4866', '7564', '8111'], // Sample player IDs
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
    ...overrides,
  }
}

/**
 * Create a mock Sleeper player
 */
export function createMockSleeperPlayer(overrides?: Partial<SleeperPlayer>): SleeperPlayer {
  return {
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
    depth_chart_order: 1,
    ...overrides,
  }
}

/**
 * Create a mock Sleeper transaction
 */
export function createMockSleeperTransaction(overrides?: Partial<SleeperTransaction>): SleeperTransaction {
  return {
    transaction_id: 'txn123',
    type: 'trade',
    status: 'complete',
    leg: 1,
    created: Date.now(),
    roster_ids: [1, 2],
    settings: null,
    consenter_ids: [1, 2],
    draft_picks: [],
    adds: { '4866': 2 },
    drops: { '7564': 1 },
    ...overrides,
  }
}

/**
 * Create multiple mock Sleeper players
 */
export function createMockSleeperPlayers(count: number): Record<string, SleeperPlayer> {
  const players: Record<string, SleeperPlayer> = {}
  const positions = ['QB', 'RB', 'WR', 'TE']
  const teams = ['KC', 'BUF', 'SF', 'PHI', 'DAL', 'MIA', 'CIN', 'LAC']

  for (let i = 0; i < count; i++) {
    const playerId = `player${i + 1}`
    players[playerId] = createMockSleeperPlayer({
      player_id: playerId,
      first_name: `Player${i + 1}`,
      last_name: `Last${i + 1}`,
      full_name: `Player${i + 1} Last${i + 1}`,
      position: positions[i % positions.length] as any,
      team: teams[i % teams.length],
      age: 20 + (i % 15),
      years_exp: i % 10,
    })
  }

  return players
}

/**
 * Create mock NFL weekly stats
 */
export function createMockNFLWeeklyStats(playerId: string, overrides?: any) {
  return {
    player_id: playerId,
    season: 2024,
    week: 1,
    player_name: 'Test Player',
    team: 'KC',
    position: 'QB',
    pass_yards: 312,
    pass_tds: 3,
    pass_ints: 1,
    rush_yards: 25,
    rush_tds: 0,
    receptions: 0,
    rec_yards: 0,
    rec_tds: 0,
    fantasy_points_ppr: 28.5,
    ...overrides,
  }
}

/**
 * Create mock AI ranking
 */
export function createMockAIRanking(overrides?: any) {
  return {
    player: 'Patrick Mahomes',
    position: 'QB',
    rank: 1,
    tier: 1,
    analysis: 'Elite QB1 with MVP upside',
    confidence: 0.95,
    ...overrides,
  }
}

/**
 * Create mock trade evaluation
 */
export function createMockTradeEvaluation(overrides?: any) {
  return {
    tradeId: 'trade123',
    teamAValue: 100,
    teamBValue: 95,
    winner: 'Team A',
    fairness: 'Fair',
    analysis: 'Slight advantage to Team A',
    confidence: 0.85,
    ...overrides,
  }
}
