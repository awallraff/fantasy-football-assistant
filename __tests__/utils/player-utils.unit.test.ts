/**
 * Player Utils Unit Tests
 *
 * Tests for player utility functions including:
 * - Player name formatting (formatPlayerName)
 * - Position normalization (normalizePosition)
 * - Position priority sorting (getPositionPriority)
 * - League position filtering (getRelevantPositions)
 * - Player filtering by position (filterPlayersByPosition)
 * - Injury badge color mapping (getInjuryBadgeColor)
 */

import {
  formatPlayerName,
  normalizePosition,
  getPositionPriority,
  getRelevantPositions,
  filterPlayersByPosition,
  getInjuryBadgeColor,
} from '@/lib/player-utils'
import { createMockSleeperPlayer } from './test-factories'

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

describe('Player Utils - formatPlayerName', () => {
  it('should return full name when available', () => {
    const player = createMockSleeperPlayer({
      player_id: '4866',
      full_name: 'Patrick Mahomes',
      first_name: 'Patrick',
      last_name: 'Mahomes',
    })

    expect(formatPlayerName(player)).toBe('Patrick Mahomes')
  })

  it('should construct name from first and last name when full name missing', () => {
    const player = createMockSleeperPlayer({
      player_id: '1234',
      full_name: undefined,
      first_name: 'Travis',
      last_name: 'Kelce',
    })

    expect(formatPlayerName(player)).toBe('Travis Kelce')
  })

  it('should return player ID as fallback when no names available', () => {
    const player = createMockSleeperPlayer({
      player_id: '9999',
      full_name: undefined,
      first_name: undefined,
      last_name: undefined,
    })

    expect(formatPlayerName(player)).toBe('Player 9999')
  })

  it('should handle empty string names', () => {
    const player = createMockSleeperPlayer({
      player_id: '5555',
      full_name: '',
      first_name: '',
      last_name: '',
    })

    expect(formatPlayerName(player)).toBe('Player 5555')
  })

  it('should prioritize full name over first and last name', () => {
    const player = createMockSleeperPlayer({
      player_id: '7777',
      full_name: 'Patrick Mahomes II',
      first_name: 'Patrick',
      last_name: 'Mahomes',
    })

    expect(formatPlayerName(player)).toBe('Patrick Mahomes II')
  })
})

describe('Player Utils - normalizePosition', () => {
  describe('should normalize standard positions', () => {
    it('should normalize QB', () => {
      expect(normalizePosition('qb')).toBe('QB')
      expect(normalizePosition('QB')).toBe('QB')
      expect(normalizePosition('Qb')).toBe('QB')
    })

    it('should normalize RB', () => {
      expect(normalizePosition('rb')).toBe('RB')
      expect(normalizePosition('RB')).toBe('RB')
    })

    it('should normalize WR', () => {
      expect(normalizePosition('wr')).toBe('WR')
      expect(normalizePosition('WR')).toBe('WR')
    })

    it('should normalize TE', () => {
      expect(normalizePosition('te')).toBe('TE')
      expect(normalizePosition('TE')).toBe('TE')
    })

    it('should normalize K', () => {
      expect(normalizePosition('k')).toBe('K')
      expect(normalizePosition('K')).toBe('K')
    })
  })

  describe('should normalize defense positions', () => {
    it('should normalize DEF', () => {
      expect(normalizePosition('def')).toBe('DEF')
      expect(normalizePosition('DEF')).toBe('DEF')
    })

    it('should normalize DST to DEF', () => {
      expect(normalizePosition('dst')).toBe('DEF')
      expect(normalizePosition('DST')).toBe('DEF')
    })

    it('should normalize defense to DEF', () => {
      expect(normalizePosition('defense')).toBe('DEF')
      expect(normalizePosition('DEFENSE')).toBe('DEF')
    })
  })

  describe('should normalize numeric positions', () => {
    it('should map 1 to QB', () => {
      expect(normalizePosition('1')).toBe('QB')
    })

    it('should map 2 to RB', () => {
      expect(normalizePosition('2')).toBe('RB')
    })

    it('should map 3 to WR', () => {
      expect(normalizePosition('3')).toBe('WR')
    })

    it('should map 4 to TE', () => {
      expect(normalizePosition('4')).toBe('TE')
    })

    it('should map 5 to K', () => {
      expect(normalizePosition('5')).toBe('K')
    })

    it('should map 6 to DEF', () => {
      expect(normalizePosition('6')).toBe('DEF')
    })
  })

  describe('should handle edge cases', () => {
    it('should return UNKNOWN for null', () => {
      expect(normalizePosition(null)).toBe('UNKNOWN')
    })

    it('should return UNKNOWN for undefined', () => {
      expect(normalizePosition(undefined)).toBe('UNKNOWN')
    })

    it('should return UNKNOWN for empty string', () => {
      expect(normalizePosition('')).toBe('UNKNOWN')
    })

    it('should uppercase unrecognized positions', () => {
      expect(normalizePosition('flex')).toBe('FLEX')
      expect(normalizePosition('super_flex')).toBe('SUPER_FLEX')
      expect(normalizePosition('bn')).toBe('BN')
    })
  })
})

describe('Player Utils - getPositionPriority', () => {
  it('should return priority 1 for QB', () => {
    expect(getPositionPriority('QB')).toBe(1)
  })

  it('should return priority 2 for RB', () => {
    expect(getPositionPriority('RB')).toBe(2)
  })

  it('should return priority 3 for WR', () => {
    expect(getPositionPriority('WR')).toBe(3)
  })

  it('should return priority 4 for TE', () => {
    expect(getPositionPriority('TE')).toBe(4)
  })

  it('should return priority 5 for K', () => {
    expect(getPositionPriority('K')).toBe(5)
  })

  it('should return priority 6 for DEF', () => {
    expect(getPositionPriority('DEF')).toBe(6)
  })

  it('should return default priority 99 for unknown positions', () => {
    expect(getPositionPriority('FLEX')).toBe(99)
    expect(getPositionPriority('BN')).toBe(99)
    expect(getPositionPriority('UNKNOWN')).toBe(99)
  })

  it('should be case-sensitive', () => {
    expect(getPositionPriority('qb')).toBe(99) // lowercase not recognized
    expect(getPositionPriority('QB')).toBe(1) // uppercase recognized
  })
})

describe('Player Utils - getRelevantPositions', () => {
  it('should extract and sort relevant positions from league settings', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'BN', 'BN', 'BN'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB', 'WR', 'TE'])
    expect(result).not.toContain('FLEX')
    expect(result).not.toContain('BN')
  })

  it('should exclude FLEX positions', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'RB', 'FLEX', 'BN'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB'])
    expect(result).not.toContain('FLEX')
    expect(result).not.toContain('BN')
  })

  it('should include SUPER_FLEX as it is a valid position', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'SUPER_FLEX', 'FLEX'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'SUPER_FLEX'])
    expect(result).toContain('SUPER_FLEX')
    expect(result).not.toContain('FLEX')
  })

  it('should exclude bench positions', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'RB', 'BN', 'BENCH'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB'])
    expect(result).not.toContain('BN')
    expect(result).not.toContain('BENCH')
  })

  it('should exclude IR and TAXI positions', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'RB', 'IR', 'TAXI'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB'])
    expect(result).not.toContain('IR')
    expect(result).not.toContain('TAXI')
  })

  it('should normalize positions before filtering', () => {
    const leagueSettings = {
      roster_positions: ['qb', 'rb', 'wr', 'te', 'flex', 'bn'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB', 'WR', 'TE'])
  })

  it('should deduplicate positions', () => {
    const leagueSettings = {
      roster_positions: ['QB', 'RB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB', 'WR', 'TE'])
    expect(result.filter((pos) => pos === 'RB')).toHaveLength(1)
  })

  it('should sort positions by priority', () => {
    const leagueSettings = {
      roster_positions: ['TE', 'WR', 'QB', 'DEF', 'RB', 'K'],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual(['QB', 'RB', 'WR', 'TE', 'K', 'DEF'])
  })

  it('should handle empty roster positions', () => {
    const leagueSettings = {
      roster_positions: [],
    }

    const result = getRelevantPositions(leagueSettings)

    expect(result).toEqual([])
  })
})

describe('Player Utils - filterPlayersByPosition', () => {
  it('should filter players by position', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', full_name: 'Patrick Mahomes', position: 'QB' }),
      '2': createMockSleeperPlayer({ player_id: '2', full_name: 'Josh Allen', position: 'QB' }),
      '3': createMockSleeperPlayer({ player_id: '3', full_name: 'Christian McCaffrey', position: 'RB' }),
    }

    const result = filterPlayersByPosition(players, 'QB')

    expect(result).toHaveLength(2)
    expect(result.every((player) => player.position === 'QB')).toBe(true)
  })

  it('should sort players alphabetically by name', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', full_name: 'Zach Wilson', position: 'QB' }),
      '2': createMockSleeperPlayer({ player_id: '2', full_name: 'Aaron Rodgers', position: 'QB' }),
      '3': createMockSleeperPlayer({ player_id: '3', full_name: 'Josh Allen', position: 'QB' }),
    }

    const result = filterPlayersByPosition(players, 'QB')

    expect(result[0].full_name).toBe('Aaron Rodgers')
    expect(result[1].full_name).toBe('Josh Allen')
    expect(result[2].full_name).toBe('Zach Wilson')
  })

  it('should normalize positions before filtering', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', full_name: 'Player 1', position: 'qb' }),
      '2': createMockSleeperPlayer({ player_id: '2', full_name: 'Player 2', position: 'QB' }),
    }

    const result = filterPlayersByPosition(players, 'QB')

    expect(result).toHaveLength(2)
  })

  it('should return empty array when no players match position', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', position: 'QB' }),
      '2': createMockSleeperPlayer({ player_id: '2', position: 'RB' }),
    }

    const result = filterPlayersByPosition(players, 'TE')

    expect(result).toEqual([])
  })

  it('should handle empty player object', () => {
    const players = {}

    const result = filterPlayersByPosition(players, 'QB')

    expect(result).toEqual([])
  })

  it('should filter out players with no position', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', position: 'QB', full_name: 'QB Player' }),
      '2': createMockSleeperPlayer({ player_id: '2', position: undefined, full_name: 'No Position' }),
      '3': createMockSleeperPlayer({ player_id: '3', position: null as any, full_name: 'Null Position' }),
    }

    const result = filterPlayersByPosition(players, 'QB')

    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('QB Player')
  })

  it('should handle DST/DEF position normalization', () => {
    const players = {
      '1': createMockSleeperPlayer({ player_id: '1', position: 'DEF', full_name: 'Team A' }),
      '2': createMockSleeperPlayer({ player_id: '2', position: 'DST' as any, full_name: 'Team B' }),
    }

    const result = filterPlayersByPosition(players, 'DEF')

    expect(result).toHaveLength(2)
  })
})

describe('Player Utils - getInjuryBadgeColor', () => {
  it('should return "destructive" for "out" status', () => {
    expect(getInjuryBadgeColor('out')).toBe('destructive')
    expect(getInjuryBadgeColor('Out')).toBe('destructive')
    expect(getInjuryBadgeColor('OUT')).toBe('destructive')
  })

  it('should return "secondary" for "doubtful" status', () => {
    expect(getInjuryBadgeColor('doubtful')).toBe('secondary')
    expect(getInjuryBadgeColor('Doubtful')).toBe('secondary')
    expect(getInjuryBadgeColor('DOUBTFUL')).toBe('secondary')
  })

  it('should return "outline" for "questionable" status', () => {
    expect(getInjuryBadgeColor('questionable')).toBe('outline')
    expect(getInjuryBadgeColor('Questionable')).toBe('outline')
    expect(getInjuryBadgeColor('QUESTIONABLE')).toBe('outline')
  })

  it('should return "default" for undefined status', () => {
    expect(getInjuryBadgeColor(undefined)).toBe('default')
  })

  it('should return "default" for empty string', () => {
    expect(getInjuryBadgeColor('')).toBe('default')
  })

  it('should return "default" for unrecognized status', () => {
    expect(getInjuryBadgeColor('healthy')).toBe('default')
    expect(getInjuryBadgeColor('probable')).toBe('default')
    expect(getInjuryBadgeColor('active')).toBe('default')
  })

  it('should be case-insensitive', () => {
    expect(getInjuryBadgeColor('oUt')).toBe('destructive')
    expect(getInjuryBadgeColor('DoUbTfUl')).toBe('secondary')
    expect(getInjuryBadgeColor('QuEsTiOnAbLe')).toBe('outline')
  })
})
