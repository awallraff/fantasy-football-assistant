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

// ============================================================================
// 2025 Rookie Class Data (Hardcoded - Will be replaced with API/Database)
// ============================================================================

/**
 * 2025 NFL Draft - Top Rookie Prospects
 * This is a simplified dataset. In production, this would come from:
 * - External API (FantasyPros, Dynasty Nerds, etc.)
 * - Database with admin management interface
 * - Regular updates during draft season
 */
const ROOKIE_CLASS_2025: RookiePlayer[] = [
  // Top QBs
  {
    player_id: 'rookie_2025_shedeur_sanders',
    first_name: 'Shedeur',
    last_name: 'Sanders',
    full_name: 'Shedeur Sanders',
    position: 'QB',
    team: 'TBD', // Pre-draft
    age: 23,
    height: '6\'2"',
    weight: '215',
    years_exp: 0,
    college: 'Colorado', // Note: This is the string from Sleeper, not CollegeProduction object
    fantasy_positions: ['QB'],
    nflDraft: {
      year: 2025,
      round: 1,
      overallPick: 1, // Projected
      draftedBy: 'TBD',
    },
    projection: {
      year1PPG: 18.5,
      year3PPG: 24.0,
      ceiling: 'Top 3 QB (Josh Allen tier)',
      floor: 'QB20-25 (Inconsistent starter)',
      mostLikely: 'QB10-15 (Solid QB1)',
      bustRisk: 25,
    },
    consensusRank: 3,
    positionRank: 1,
    tier: 1,
    landingSpotGrade: 'B',
    strengths: [
      'Elite arm talent and accuracy',
      'Advanced pocket presence and processing',
      'High football IQ and leadership',
    ],
    concerns: [
      'Limited experience against elite competition',
      'Needs to improve under pressure',
      'Landing spot uncertainty',
    ],
  },
  // Top RBs
  {
    player_id: 'rookie_2025_ashton_jeanty',
    first_name: 'Ashton',
    last_name: 'Jeanty',
    full_name: 'Ashton Jeanty',
    position: 'RB',
    team: 'TBD',
    age: 21,
    height: '5\'9"',
    weight: '215',
    years_exp: 0,
    college: 'Boise State',
    fantasy_positions: ['RB'],
    nflDraft: {
      year: 2025,
      round: 1,
      overallPick: 8, // Projected
      draftedBy: 'TBD',
    },
    projection: {
      year1PPG: 15.2,
      year3PPG: 18.5,
      ceiling: 'Elite RB1 (CMC tier)',
      floor: 'RB25-30 (Backup/Committee)',
      mostLikely: 'RB8-12 (Low-end RB1)',
      bustRisk: 30,
    },
    consensusRank: 1,
    positionRank: 1,
    tier: 1,
    landingSpotGrade: 'A-',
    strengths: [
      'Breakaway speed and explosiveness',
      'Excellent vision and patience',
      'Proven workhorse with 2,000+ yard season',
    ],
    concerns: [
      'Smaller frame for workhorse role',
      'Boise State competition level',
      'RB position devaluation in dynasty',
    ],
  },
  // Top WRs
  {
    player_id: 'rookie_2025_tetairoa_mcmillan',
    first_name: 'Tetairoa',
    last_name: 'McMillan',
    full_name: 'Tetairoa McMillan',
    position: 'WR',
    team: 'TBD',
    age: 21,
    height: '6\'5"',
    weight: '212',
    years_exp: 0,
    college: 'Arizona',
    fantasy_positions: ['WR'],
    nflDraft: {
      year: 2025,
      round: 1,
      overallPick: 4, // Projected
      draftedBy: 'TBD',
    },
    projection: {
      year1PPG: 12.8,
      year3PPG: 16.5,
      ceiling: 'Elite WR1 (Justin Jefferson tier)',
      floor: 'WR35-40 (Boom/bust WR3)',
      mostLikely: 'WR12-18 (Solid WR2)',
      bustRisk: 20,
    },
    consensusRank: 2,
    positionRank: 1,
    tier: 1,
    landingSpotGrade: 'A',
    strengths: [
      'Elite size/speed combination',
      'Dominant contested catch ability',
      'High target share in college',
    ],
    concerns: [
      'Route refinement needed',
      'Occasional drops',
      'Needs alpha QB to maximize value',
    ],
  },
  // Top TEs
  {
    player_id: 'rookie_2025_tyler_warren',
    first_name: 'Tyler',
    last_name: 'Warren',
    full_name: 'Tyler Warren',
    position: 'TE',
    team: 'TBD',
    age: 23,
    height: '6\'6"',
    weight: '255',
    years_exp: 0,
    college: 'Penn State',
    fantasy_positions: ['TE'],
    nflDraft: {
      year: 2025,
      round: 2,
      overallPick: 45, // Projected
      draftedBy: 'TBD',
    },
    projection: {
      year1PPG: 8.5,
      year3PPG: 12.0,
      ceiling: 'Top 5 TE (Travis Kelce tier)',
      floor: 'TE20+ (Streaming option)',
      mostLikely: 'TE8-12 (Low-end TE1)',
      bustRisk: 35,
    },
    consensusRank: 15,
    positionRank: 1,
    tier: 2,
    landingSpotGrade: 'B+',
    strengths: [
      'Versatile H-back/move TE',
      'Excellent blocker and receiver',
      'High football IQ',
    ],
    concerns: [
      'Late breakout (age concern)',
      'TE position takes 2-3 years to develop',
      'Needs pass-heavy offense',
    ],
  },
];

// ============================================================================
// Rookie Data Service
// ============================================================================

/**
 * Get the complete rookie draft class for a given year
 */
export function getRookieDraftClass(year: number = 2025): RookieDraftClass {
  // In production, this would fetch from API/database
  if (year === 2025) {
    return {
      year: 2025,
      players: ROOKIE_CLASS_2025,
      rankings: generateRankingsFromPlayers(ROOKIE_CLASS_2025),
      updatedAt: new Date(),
      sources: ['internal'], // Would include multiple sources in production
    };
  }

  // Return empty class for other years (not yet implemented)
  return {
    year,
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
      playerName: player.full_name,
      position: player.position,
      team: player.team,
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
export function getRookiePlayer(playerId: string, year: number = 2025): RookiePlayer | null {
  const draftClass = getRookieDraftClass(year);
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
    filtered = filtered.filter((p) => options.position!.includes(p.position));
  }

  if (options.tier?.length) {
    filtered = filtered.filter((p) => options.tier!.includes(p.tier));
  }

  if (options.team?.length) {
    filtered = filtered.filter((p) => options.team!.includes(p.team));
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
        if (a.position !== b.position) {
          return a.position.localeCompare(b.position);
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
export function getRookiesByPosition(
  position: string,
  year: number = 2025
): RookiePlayer[] {
  const draftClass = getRookieDraftClass(year);
  return draftClass.players
    .filter((p) => p.position === position)
    .sort((a, b) => a.positionRank - b.positionRank);
}

/**
 * Get top rookies (by consensus rank)
 */
export function getTopRookies(
  count: number = 10,
  year: number = 2025
): RookiePlayer[] {
  const draftClass = getRookieDraftClass(year);
  return draftClass.players
    .sort((a, b) => a.consensusRank - b.consensusRank)
    .slice(0, count);
}

/**
 * Get rookies by tier
 */
export function getRookiesByTier(
  tier: number,
  year: number = 2025
): RookiePlayer[] {
  const draftClass = getRookieDraftClass(year);
  return draftClass.players
    .filter((p) => p.tier === tier)
    .sort((a, b) => a.consensusRank - b.consensusRank);
}

/**
 * Search rookies by name
 */
export function searchRookies(
  query: string,
  year: number = 2025
): RookiePlayer[] {
  const draftClass = getRookieDraftClass(year);
  const lowerQuery = query.toLowerCase();

  return draftClass.players.filter((p) => {
    const collegeString = p.college
      ? typeof p.college === 'string'
        ? p.college
        : p.college.school
      : '';

    return (
      p.full_name.toLowerCase().includes(lowerQuery) ||
      p.first_name.toLowerCase().includes(lowerQuery) ||
      p.last_name.toLowerCase().includes(lowerQuery) ||
      collegeString.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get rookie draft class statistics
 */
export function getRookieClassStats(year: number = 2025): {
  totalPlayers: number;
  byPosition: Record<string, number>;
  byTier: Record<number, number>;
  averageAge: number;
  averageNFLDraftPosition: number;
} {
  const draftClass = getRookieDraftClass(year);
  const players = draftClass.players;

  const byPosition: Record<string, number> = {};
  const byTier: Record<number, number> = {};
  let totalAge = 0;
  let totalNFLPick = 0;

  players.forEach((p) => {
    byPosition[p.position] = (byPosition[p.position] || 0) + 1;
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
export function compareRookies(
  playerId1: string,
  playerId2: string,
  year: number = 2025
): {
  player1: RookiePlayer | null;
  player2: RookiePlayer | null;
  comparison: {
    consensusRank: { winner: 1 | 2 | 'tie'; diff: number };
    nflDraftCapital: { winner: 1 | 2 | 'tie'; diff: number };
    projection: { winner: 1 | 2 | 'tie'; diff: number };
    landingSpot: { winner: 1 | 2 | 'tie' };
  };
} | null {
  const player1 = getRookiePlayer(playerId1, year);
  const player2 = getRookiePlayer(playerId2, year);

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
