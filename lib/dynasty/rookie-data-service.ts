/**
 * Rookie Draft Data Service
 *
 * This service manages rookie player data, rankings, and draft board state.
 * It provides utilities for filtering, sorting, and analyzing rookie prospects.
 */

import type {
  RookiePlayer,
  RookieRanking,
  RookieDraftClass,
  RookieFilterOptions,
  RookieSortOption,
  NFLDraftCapital,
  DynastyProjection,
} from './rookie-draft-types';
import type { SleeperPlayer } from '@/lib/sleeper-api';

import { rookieNFLDataService } from './rookie-nfl-data-service';
import { getCurrentRookieSeasonYear } from './rookie-season-utils';

// ============================================================================
// 2025 Rookie Class Data (Fetched from NFL Data API)
// ============================================================================

/**
 * 2025 NFL Draft - Real Draft Data
 * Data is fetched from nfl_data_py Python library via rookie-nfl-data-service.ts
 *
 * Data Sources:
 * - nfl_data_py.import_draft_picks() - 2025 NFL Draft results (static after draft)
 * - nfl_data_py.import_seasonal_rosters() - Current roster status (updated weekly)
 * - nfl_data_py.import_weekly_data() - Performance data (real-time during season)
 *
 * Update Frequency:
 * - Draft capital: Static (April 2025)
 * - Roster status: Weekly
 * - Performance stats: Live during games
 * - Landing spot grades: Manual updates based on team analysis
 */
let ROOKIE_CLASS_2025: RookiePlayer[] = []
let lastFetchTime: Date | null = null
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24 // 24 hours (draft data is static)

/**
 * Fetch and cache 2025 rookie data from Python/NFL Data API
 */
async function fetch2025RookieData(): Promise<RookiePlayer[]> {
  // Check cache validity
  if (ROOKIE_CLASS_2025.length > 0 && lastFetchTime) {
    const cacheAge = Date.now() - lastFetchTime.getTime()
    if (cacheAge < CACHE_DURATION_MS) {
      console.log(`[RookieDataService] Using cached data (age: ${Math.floor(cacheAge / 1000 / 60)} minutes)`)
      return ROOKIE_CLASS_2025
    }
  }

  try {
    console.log('[RookieDataService] Fetching fresh 2025 rookie data...')
    const rookies = await rookieNFLDataService.fetch2025RookieData()

    if (rookies.length > 0) {
      ROOKIE_CLASS_2025 = rookies
      lastFetchTime = new Date()
      console.log(`[RookieDataService] Successfully loaded ${rookies.length} rookies`)
    } else {
      console.warn('[RookieDataService] No rookie data returned from Python service')
      // Keep existing cache if fetch fails
    }

    return ROOKIE_CLASS_2025
  } catch (error) {
    console.error('[RookieDataService] Error fetching rookie data:', error)
    // Return cached data if available, otherwise empty array
    return ROOKIE_CLASS_2025
  }
}

// ============================================================================
// Rookie Data Service
// ============================================================================

/**
 * Get the complete rookie draft class for a given year
 * Note: This is now async to support fetching real NFL data
 *
 * @param year - Rookie season year (defaults to dynamically calculated current season)
 */
export async function getRookieDraftClass(year?: number): Promise<RookieDraftClass> {
  // Use dynamic rookie season if not specified
  const rookieYear = year ?? getCurrentRookieSeasonYear();

  // Fetch 2025 data from NFL Data API
  if (rookieYear === 2025) {
    const players = await fetch2025RookieData()

    return {
      year: 2025,
      players,
      rankings: generateRankingsFromPlayers(players),
      updatedAt: lastFetchTime || new Date(),
      sources: ['internal'], // Real data from nfl_data_py via internal API
    };
  }

  // Return empty class for other years (not yet implemented)
  return {
    year: rookieYear,
    players: [],
    rankings: [],
    updatedAt: new Date(),
    sources: [],
  };
}

/**
 * Generate rankings from rookie players
 */
function generateRankingsFromPlayers(players: RookiePlayer[]): RookieRanking[] {
  return players
    .sort((a, b) => a.consensusRank - b.consensusRank)
    .map((player) => ({
      playerId: player.player_id,
      playerName: player.full_name || 'Unknown Player',
      position: player.position || 'UNKNOWN',
      team: player.team || 'FA',
      consensusRank: player.consensusRank,
      positionRank: player.positionRank,
      tier: player.tier,
      rankings: [
        {
          source: 'internal' as const,
          overallRank: player.consensusRank,
          positionRank: player.positionRank,
          tier: player.tier,
          updatedAt: new Date(),
        },
      ],
      rankStdDev: 0, // Would calculate from multiple sources
      adp: player.consensusRank * 1.2, // Rough ADP approximation
    }));
}

/**
 * Get rookie player by ID
 */
export async function getRookiePlayer(playerId: string, year?: number): Promise<RookiePlayer | null> {
  const draftClass = await getRookieDraftClass(year);
  return draftClass.players.find((p) => p.player_id === playerId) || null;
}

/**
 * Filter rookie players
 */
export function filterRookies(
  players: RookiePlayer[],
  options: RookieFilterOptions
): RookiePlayer[] {
  let filtered = players;

  if (options.position?.length) {
    filtered = filtered.filter((p) => p.position && options.position!.includes(p.position));
  }

  if (options.tier?.length) {
    filtered = filtered.filter((p) => options.tier!.includes(p.tier));
  }

  if (options.team?.length) {
    filtered = filtered.filter((p) => p.team && options.team!.includes(p.team));
  }

  if (options.landingSpotGrade?.length) {
    filtered = filtered.filter((p) => options.landingSpotGrade!.includes(p.landingSpotGrade));
  }

  if (options.minRank !== undefined) {
    filtered = filtered.filter((p) => p.consensusRank >= options.minRank!);
  }

  if (options.maxRank !== undefined) {
    filtered = filtered.filter((p) => p.consensusRank <= options.maxRank!);
  }

  return filtered;
}

/**
 * Sort rookie players
 */
export function sortRookies(
  players: RookiePlayer[],
  sortBy: RookieSortOption
): RookiePlayer[] {
  const sorted = [...players];

  switch (sortBy) {
    case 'consensus-rank':
      return sorted.sort((a, b) => a.consensusRank - b.consensusRank);

    case 'adp':
      // ADP approximation: consensusRank * 1.2
      return sorted.sort((a, b) => a.consensusRank * 1.2 - b.consensusRank * 1.2);

    case 'nfl-draft-capital':
      return sorted.sort((a, b) => a.nflDraft.overallPick - b.nflDraft.overallPick);

    case 'position-rank':
      return sorted.sort((a, b) => {
        const aPos = a.position || 'UNKNOWN';
        const bPos = b.position || 'UNKNOWN';
        if (aPos !== bPos) {
          return aPos.localeCompare(bPos);
        }
        return a.positionRank - b.positionRank;
      });

    case 'tier':
      return sorted.sort((a, b) => a.tier - b.tier);

    case 'upside':
      // Sort by ceiling projection (Year 3 PPG)
      return sorted.sort((a, b) => b.projection.year3PPG - a.projection.year3PPG);

    case 'landing-spot':
      const gradeOrder: Record<string, number> = {
        'A+': 1, A: 2, 'A-': 3, 'B+': 4, B: 5, 'B-': 6,
        'C+': 7, C: 8, 'C-': 9, D: 10, F: 11,
      };
      return sorted.sort((a, b) => {
        const aScore = gradeOrder[a.landingSpotGrade] || 99;
        const bScore = gradeOrder[b.landingSpotGrade] || 99;
        return aScore - bScore;
      });

    default:
      return sorted;
  }
}

/**
 * Get rookies by position
 */
export async function getRookiesByPosition(
  position: string,
  year?: number
): Promise<RookiePlayer[]> {
  const draftClass = await getRookieDraftClass(year);
  return draftClass.players
    .filter((p) => p.position === position)
    .sort((a, b) => a.positionRank - b.positionRank);
}

/**
 * Get top rookies (by consensus rank)
 */
export async function getTopRookies(
  count: number = 10,
  year?: number
): Promise<RookiePlayer[]> {
  const draftClass = await getRookieDraftClass(year);
  return draftClass.players
    .sort((a, b) => a.consensusRank - b.consensusRank)
    .slice(0, count);
}

/**
 * Get rookies by tier
 */
export async function getRookiesByTier(
  tier: number,
  year?: number
): Promise<RookiePlayer[]> {
  const draftClass = await getRookieDraftClass(year);
  return draftClass.players
    .filter((p) => p.tier === tier)
    .sort((a, b) => a.consensusRank - b.consensusRank);
}

/**
 * Search rookies by name
 */
export async function searchRookies(
  query: string,
  year?: number
): Promise<RookiePlayer[]> {
  const draftClass = await getRookieDraftClass(year);
  const lowerQuery = query.toLowerCase();

  return draftClass.players.filter((p) => {
    const collegeString = p.college
      ? typeof p.college === 'string'
        ? p.college
        : p.college.school
      : '';

    return (
      (p.full_name || '').toLowerCase().includes(lowerQuery) ||
      (p.first_name || '').toLowerCase().includes(lowerQuery) ||
      (p.last_name || '').toLowerCase().includes(lowerQuery) ||
      collegeString.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get rookie draft class statistics
 */
export async function getRookieClassStats(year?: number): Promise<{
  totalPlayers: number;
  byPosition: Record<string, number>;
  byTier: Record<number, number>;
  averageAge: number;
  averageNFLDraftPosition: number;
}> {
  const draftClass = await getRookieDraftClass(year);
  const players = draftClass.players;

  const byPosition: Record<string, number> = {};
  const byTier: Record<number, number> = {};
  let totalAge = 0;
  let totalNFLPick = 0;

  players.forEach((p) => {
    const position = p.position || 'UNKNOWN';
    byPosition[position] = (byPosition[position] || 0) + 1;
    byTier[p.tier] = (byTier[p.tier] || 0) + 1;
    totalAge += p.age || 0;
    totalNFLPick += p.nflDraft.overallPick;
  });

  return {
    totalPlayers: players.length,
    byPosition,
    byTier,
    averageAge: players.length > 0 ? totalAge / players.length : 0,
    averageNFLDraftPosition: players.length > 0 ? totalNFLPick / players.length : 0,
  };
}

/**
 * Compare two rookies side-by-side
 */
export async function compareRookies(
  playerId1: string,
  playerId2: string,
  year?: number
): Promise<{
  player1: RookiePlayer | null;
  player2: RookiePlayer | null;
  comparison: {
    consensusRank: { winner: 1 | 2 | 'tie'; diff: number };
    nflDraftCapital: { winner: 1 | 2 | 'tie'; diff: number };
    projection: { winner: 1 | 2 | 'tie'; diff: number };
    landingSpot: { winner: 1 | 2 | 'tie' };
  };
} | null> {
  const player1 = await getRookiePlayer(playerId1, year);
  const player2 = await getRookiePlayer(playerId2, year);

  if (!player1 || !player2) {
    return null;
  }

  const gradeScore: Record<string, number> = {
    'A+': 10, A: 9, 'A-': 8, 'B+': 7, B: 6, 'B-': 5,
    'C+': 4, C: 3, 'C-': 2, D: 1, F: 0,
  };

  return {
    player1,
    player2,
    comparison: {
      consensusRank: {
        winner: player1.consensusRank < player2.consensusRank ? 1 : player1.consensusRank > player2.consensusRank ? 2 : 'tie',
        diff: Math.abs(player1.consensusRank - player2.consensusRank),
      },
      nflDraftCapital: {
        winner: player1.nflDraft.overallPick < player2.nflDraft.overallPick ? 1 : player1.nflDraft.overallPick > player2.nflDraft.overallPick ? 2 : 'tie',
        diff: Math.abs(player1.nflDraft.overallPick - player2.nflDraft.overallPick),
      },
      projection: {
        winner: player1.projection.year3PPG > player2.projection.year3PPG ? 1 : player1.projection.year3PPG < player2.projection.year3PPG ? 2 : 'tie',
        diff: Math.abs(player1.projection.year3PPG - player2.projection.year3PPG),
      },
      landingSpot: {
        winner: gradeScore[player1.landingSpotGrade] > gradeScore[player2.landingSpotGrade] ? 1 : gradeScore[player1.landingSpotGrade] < gradeScore[player2.landingSpotGrade] ? 2 : 'tie',
      },
    },
  };
}
