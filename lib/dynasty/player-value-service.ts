/**
 * Dynasty Player Value Calculator
 *
 * This service calculates comprehensive dynasty values for players by combining:
 * - Current production (recent fantasy performance)
 * - Age curve analysis (position-specific aging patterns)
 * - Contract/team situation (stability, opportunity share)
 * - Positional scarcity (depth at position)
 * - Upside/floor variance (outcome distribution)
 *
 * Values are on a 0-1000 scale matching draft pick valuation for easy comparison.
 */

import type { SleeperPlayer } from '@/lib/sleeper-api';
import {
  calculatePlayerTrajectory,
  getCareerPhase,
  type PlayerTrajectory,
} from './age-curve-service';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Dynasty value tier classification
 */
export type DynastyValueTier = 'elite' | 'premium' | 'solid' | 'depth' | 'lottery';

/**
 * Buy/sell/hold recommendation
 */
export type DynastyRecommendation = 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';

/**
 * Complete dynasty player valuation
 */
export interface DynastyPlayerValue {
  /** Player info */
  playerId: string;
  playerName: string;
  position: string;
  age: number;
  team: string;

  /** Final dynasty value (0-1000 scale) */
  dynastyValue: number;

  /** Value tier */
  tier: DynastyValueTier;

  /** Component scores (0-100 each) */
  components: {
    productionScore: number;
    ageCurveScore: number;
    situationScore: number;
    scarcityScore: number;
    upsideScore: number;
  };

  /** Equivalent draft pick value range */
  equivalentPickRange: {
    low: string; // e.g., "Late 1st"
    high: string; // e.g., "Early 2nd"
  };

  /** 3-year value projection */
  valueProjection: {
    currentValue: number;
    year1Value: number;
    year2Value: number;
    year3Value: number;
    trend: 'ascending' | 'stable' | 'declining';
  };

  /** Buy/sell/hold recommendation */
  recommendation: DynastyRecommendation;

  /** Rationale for recommendation */
  rationale: string;

  /** Comparable players (similar value) */
  comparables: string[];
}

/**
 * Position scarcity data
 */
interface PositionScarcity {
  position: string;
  elitePlayers: number; // Top tier available
  depthScore: number; // 0-100 (higher = deeper position = less scarce)
}

// ============================================================================
// Configuration & Constants
// ============================================================================

/**
 * Position weights for value calculation
 */
const POSITION_WEIGHTS = {
  QB: {
    production: 0.30,
    ageCurve: 0.25,
    situation: 0.20,
    scarcity: 0.15,
    upside: 0.10,
  },
  RB: {
    production: 0.35,
    ageCurve: 0.30, // RB age matters most
    situation: 0.20,
    scarcity: 0.10,
    upside: 0.05,
  },
  WR: {
    production: 0.30,
    ageCurve: 0.20,
    situation: 0.25, // WR situation matters (QB, targets)
    scarcity: 0.15,
    upside: 0.10,
  },
  TE: {
    production: 0.35,
    ageCurve: 0.20,
    situation: 0.20,
    scarcity: 0.20, // TE very scarce
    upside: 0.05,
  },
};

/**
 * Position scarcity baseline (2025 season approximation)
 */
const POSITION_SCARCITY: Record<string, PositionScarcity> = {
  QB: {
    position: 'QB',
    elitePlayers: 12, // ~12 startable QBs
    depthScore: 60, // Moderate depth
  },
  RB: {
    position: 'RB',
    elitePlayers: 24, // ~24 startable RBs
    depthScore: 40, // Shallow position
  },
  WR: {
    position: 'WR',
    elitePlayers: 36, // ~36 startable WRs
    depthScore: 70, // Deep position
  },
  TE: {
    position: 'TE',
    elitePlayers: 8, // ~8 elite TEs
    depthScore: 25, // Very shallow
  },
};

// ============================================================================
// Dynasty Value Calculation
// ============================================================================

/**
 * Calculate production score (0-100) based on recent performance
 * In production, this would use actual fantasy points data
 */
function calculateProductionScore(
  player: SleeperPlayer,
  recentPPG: number = 15.0 // Would come from stats API
): number {
  const position = player.position || 'WR';

  // Position-specific PPG thresholds for scoring
  const thresholds = {
    QB: { elite: 25, good: 20, average: 15, poor: 10 },
    RB: { elite: 20, good: 15, average: 10, poor: 5 },
    WR: { elite: 18, good: 14, average: 10, poor: 6 },
    TE: { elite: 15, good: 12, average: 8, poor: 4 },
  };

  const posThresholds = thresholds[position as keyof typeof thresholds] || thresholds.WR;

  if (recentPPG >= posThresholds.elite) return 100;
  if (recentPPG >= posThresholds.good) return 80;
  if (recentPPG >= posThresholds.average) return 60;
  if (recentPPG >= posThresholds.poor) return 40;
  return 20;
}

/**
 * Calculate age curve score (0-100) based on career phase
 */
function calculateAgeCurveScore(player: SleeperPlayer): number {
  const age = player.age || 25;
  const position = player.position || 'WR';
  const phase = getCareerPhase(position, age);

  switch (phase) {
    case 'emerging':
      return 70; // High upside, uncertainty
    case 'ascending':
      return 90; // Approaching peak
    case 'peak':
      return 100; // Maximize value now
    case 'declining':
      return 50; // Losing value
    case 'cliff':
      return 20; // Minimal value
    default:
      return 60;
  }
}

/**
 * Calculate situation score (0-100) based on team context
 * In production, this would analyze:
 * - Team offense quality
 * - Opportunity share (snap %, target share, etc.)
 * - QB quality (for skill positions)
 * - Offensive line (for RBs)
 */
function calculateSituationScore(player: SleeperPlayer): number {
  // Placeholder: Would integrate real team/situation data
  const team = player.team || 'FA';

  // Top offense teams get higher scores
  const eliteOffenses = ['KC', 'SF', 'BUF', 'DAL', 'MIA', 'DET'];
  const goodOffenses = ['PHI', 'CIN', 'TB', 'LAC', 'BAL', 'GB'];

  if (team === 'FA') return 30; // Free agent = uncertainty
  if (eliteOffenses.includes(team)) return 90;
  if (goodOffenses.includes(team)) return 75;
  return 60; // Average situation
}

/**
 * Calculate scarcity score (0-100) based on positional depth
 */
function calculateScarcityScore(position: string): number {
  const scarcity = POSITION_SCARCITY[position] || POSITION_SCARCITY['WR'];
  // Inverse of depth score (scarce positions = higher value)
  return 100 - scarcity.depthScore;
}

/**
 * Calculate upside score (0-100) based on variance potential
 */
function calculateUpsideScore(player: SleeperPlayer): number {
  const age = player.age || 25;
  const position = player.position || 'WR';

  // Young players have more upside
  if (age < 24) return 90;
  if (age < 26) return 80;
  if (age < 28) return 70;
  if (age < 30) return 55;
  return 30;
}

/**
 * Calculate complete dynasty player value
 */
export function calculateDynastyValue(
  player: SleeperPlayer,
  recentPPG: number = 15.0
): DynastyPlayerValue {
  const position = player.position || 'WR';
  const age = player.age || 25;

  // Get position-specific weights
  const weights = POSITION_WEIGHTS[position as keyof typeof POSITION_WEIGHTS] || POSITION_WEIGHTS.WR;

  // Calculate component scores
  const productionScore = calculateProductionScore(player, recentPPG);
  const ageCurveScore = calculateAgeCurveScore(player);
  const situationScore = calculateSituationScore(player);
  const scarcityScore = calculateScarcityScore(position);
  const upsideScore = calculateUpsideScore(player);

  // Weighted composite score (0-100)
  const compositeScore =
    productionScore * weights.production +
    ageCurveScore * weights.ageCurve +
    situationScore * weights.situation +
    scarcityScore * weights.scarcity +
    upsideScore * weights.upside;

  // Scale to 0-1000 (matching draft pick scale)
  const dynastyValue = Math.round(compositeScore * 10);

  // Determine tier
  const tier = determineTier(dynastyValue);

  // Calculate value projection
  const trajectory = calculatePlayerTrajectory(player, recentPPG, 3);
  const valueProjection = projectFutureValue(dynastyValue, trajectory);

  // Determine recommendation
  const { recommendation, rationale } = determineRecommendation(
    dynastyValue,
    trajectory,
    valueProjection
  );

  // Get equivalent pick range
  const equivalentPickRange = getEquivalentPickRange(dynastyValue);

  // Get comparable players (placeholder)
  const comparables = getComparablePlayers(dynastyValue, position);

  return {
    playerId: player.player_id,
    playerName: player.full_name || 'Unknown Player',
    position,
    age,
    team: player.team || 'FA',
    dynastyValue,
    tier,
    components: {
      productionScore,
      ageCurveScore,
      situationScore,
      scarcityScore,
      upsideScore,
    },
    equivalentPickRange,
    valueProjection,
    recommendation,
    rationale,
    comparables,
  };
}

/**
 * Determine value tier
 */
function determineTier(value: number): DynastyValueTier {
  if (value >= 800) return 'elite'; // Top 12 players
  if (value >= 600) return 'premium'; // Top 30 players
  if (value >= 400) return 'solid'; // Top 60 players
  if (value >= 200) return 'depth'; // Roster filler
  return 'lottery'; // Deep stashes
}

/**
 * Project future value based on age curve
 */
function projectFutureValue(
  currentValue: number,
  trajectory: PlayerTrajectory
): DynastyPlayerValue['valueProjection'] {
  const projections = trajectory.projections;

  // Simple value projection based on PPG trends
  const currentPPG = projections[0]?.projectedPPG || 15;
  const year1PPG = projections[1]?.projectedPPG || currentPPG;
  const year2PPG = projections[2]?.projectedPPG || currentPPG;
  const year3PPG = projections[3]?.projectedPPG || currentPPG;

  const year1Value = Math.round(currentValue * (year1PPG / currentPPG));
  const year2Value = Math.round(currentValue * (year2PPG / currentPPG));
  const year3Value = Math.round(currentValue * (year3PPG / currentPPG));

  // Determine trend
  let trend: 'ascending' | 'stable' | 'declining';
  if (year3Value > currentValue * 1.1) {
    trend = 'ascending';
  } else if (year3Value < currentValue * 0.9) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    currentValue,
    year1Value,
    year2Value,
    year3Value,
    trend,
  };
}

/**
 * Determine buy/sell/hold recommendation
 */
function determineRecommendation(
  currentValue: number,
  trajectory: PlayerTrajectory,
  projection: DynastyPlayerValue['valueProjection']
): { recommendation: DynastyRecommendation; rationale: string } {
  const phase = trajectory.phase;
  const valueTrend = trajectory.valueTrend;

  if (valueTrend === 'buy-now' && projection.trend === 'ascending') {
    return {
      recommendation: 'strong-buy',
      rationale: `${trajectory.playerName} is ${phase} with strong upside. Value projected to increase ${Math.round(((projection.year3Value - currentValue) / currentValue) * 100)}% over 3 years.`,
    };
  }

  if (valueTrend === 'buy-now') {
    return {
      recommendation: 'buy',
      rationale: `${trajectory.playerName} is ${phase} with good outlook. Consider buying before value peak.`,
    };
  }

  if (valueTrend === 'sell-high') {
    return {
      recommendation: 'sell',
      rationale: `${trajectory.playerName} is in ${phase} phase. Value at/near peak. Consider selling high before decline.`,
    };
  }

  if (valueTrend === 'sell-now') {
    return {
      recommendation: 'strong-sell',
      rationale: `${trajectory.playerName} is ${phase}. Value declining rapidly. Sell immediately while value remains.`,
    };
  }

  return {
    recommendation: 'hold',
    rationale: `${trajectory.playerName} is stable. Hold for production unless overpay offer arrives.`,
  };
}

/**
 * Get equivalent draft pick range
 */
function getEquivalentPickRange(value: number): { low: string; high: string } {
  if (value >= 1000) return { low: '1.01', high: '1.02' };
  if (value >= 800) return { low: '1.03', high: '1.06' };
  if (value >= 600) return { low: '1.07', high: '1.12' };
  if (value >= 500) return { low: 'Late 1st', high: 'Early 2nd' };
  if (value >= 400) return { low: 'Mid 2nd', high: 'Late 2nd' };
  if (value >= 300) return { low: 'Early 3rd', high: 'Mid 3rd' };
  if (value >= 200) return { low: 'Late 3rd', high: '4th' };
  return { low: '4th+', high: '5th+' };
}

/**
 * Get comparable players (placeholder)
 */
function getComparablePlayers(value: number, position: string): string[] {
  // In production, this would query database for players with similar values
  return [`Similar ${position} (${value}±50 value)`];
}

/**
 * Batch calculate dynasty values for multiple players
 */
export function calculateDynastyValuesForRoster(
  players: SleeperPlayer[],
  playerPPGMap: Record<string, number> = {}
): DynastyPlayerValue[] {
  return players.map((player) => {
    const ppg = playerPPGMap[player.player_id] || 15.0;
    return calculateDynastyValue(player, ppg);
  });
}

/**
 * Sort players by dynasty value
 */
export function sortByDynastyValue(
  values: DynastyPlayerValue[],
  descending: boolean = true
): DynastyPlayerValue[] {
  return [...values].sort((a, b) => {
    return descending ? b.dynastyValue - a.dynastyValue : a.dynastyValue - b.dynastyValue;
  });
}

/**
 * Filter players by recommendation type
 */
export function filterByRecommendation(
  values: DynastyPlayerValue[],
  recommendations: DynastyRecommendation[]
): DynastyPlayerValue[] {
  return values.filter((v) => recommendations.includes(v.recommendation));
}

/**
 * Get top dynasty assets (elite tier)
 */
export function getTopDynastyAssets(
  values: DynastyPlayerValue[],
  count: number = 10
): DynastyPlayerValue[] {
  return sortByDynastyValue(values, true).slice(0, count);
}

/**
 * Get players to sell (strong-sell recommendation)
 */
export function getPlayersToSell(values: DynastyPlayerValue[]): DynastyPlayerValue[] {
  return filterByRecommendation(values, ['strong-sell', 'sell']);
}

/**
 * Get players to buy (strong-buy recommendation)
 */
export function getPlayersToBuy(values: DynastyPlayerValue[]): DynastyPlayerValue[] {
  return filterByRecommendation(values, ['strong-buy', 'buy']);
}
