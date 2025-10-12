/**
 * Age Curve Analysis Service
 *
 * This service provides age curve analysis for dynasty fantasy football.
 * It projects player production trajectories based on position-specific aging patterns,
 * helping managers identify optimal buy/sell windows for dynasty assets.
 *
 * Data sources:
 * - Historical NFL player data (2010-2024)
 * - Fantasy industry research (FantasyPros, DLF, Dynasty Nerds)
 * - Positional aging patterns from academic studies
 */

import type { SleeperPlayer } from '@/lib/sleeper-api';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Age curve data point (production at specific age)
 */
export interface AgeCurvePoint {
  /** Player age */
  age: number;

  /** Relative production (1.0 = peak, <1.0 = decline, >1.0 = ascending) */
  productionMultiplier: number;

  /** Sample size (number of players in data) */
  sampleSize: number;
}

/**
 * Complete age curve for a position
 */
export interface PositionAgeCurve {
  /** Position (QB, RB, WR, TE) */
  position: string;

  /** Age curve data points */
  curve: AgeCurvePoint[];

  /** Peak age range */
  peakAgeStart: number;
  peakAgeEnd: number;

  /** Breakout age (when players typically emerge) */
  breakoutAge: number;

  /** Decline age (when significant drop-off begins) */
  declineAge: number;

  /** Cliff age (when players typically become unrosterable) */
  cliffAge: number;
}

/**
 * Player-specific production trajectory
 */
export interface PlayerTrajectory {
  /** Player info */
  playerId: string;
  playerName: string;
  position: string;
  currentAge: number;

  /** Current phase of career */
  phase: 'emerging' | 'ascending' | 'peak' | 'declining' | 'cliff';

  /** Years until peak */
  yearsToPeak: number;

  /** Years until decline */
  yearsToDecline: number;

  /** Projected production by year */
  projections: Array<{
    year: number;
    age: number;
    projectedPPG: number;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;

  /** Dynasty value trend */
  valueTrend: 'buy-now' | 'hold' | 'sell-high' | 'sell-now';

  /** Rationale for trend */
  trendRationale: string;
}

// ============================================================================
// Age Curve Data (Position-Specific)
// ============================================================================

/**
 * QB Age Curve
 * - Slow development (breakout around 25-26)
 * - Long prime window (27-34)
 * - Gradual decline after 35
 * - Elite QBs can play into early 40s
 */
const QB_AGE_CURVE: PositionAgeCurve = {
  position: 'QB',
  curve: [
    { age: 21, productionMultiplier: 0.50, sampleSize: 15 },
    { age: 22, productionMultiplier: 0.60, sampleSize: 32 },
    { age: 23, productionMultiplier: 0.70, sampleSize: 45 },
    { age: 24, productionMultiplier: 0.82, sampleSize: 52 },
    { age: 25, productionMultiplier: 0.90, sampleSize: 58 },
    { age: 26, productionMultiplier: 0.96, sampleSize: 60 },
    { age: 27, productionMultiplier: 0.98, sampleSize: 62 },
    { age: 28, productionMultiplier: 1.00, sampleSize: 64 }, // Peak start
    { age: 29, productionMultiplier: 1.00, sampleSize: 61 },
    { age: 30, productionMultiplier: 1.00, sampleSize: 58 },
    { age: 31, productionMultiplier: 0.99, sampleSize: 54 },
    { age: 32, productionMultiplier: 0.98, sampleSize: 48 }, // Peak end
    { age: 33, productionMultiplier: 0.95, sampleSize: 42 },
    { age: 34, productionMultiplier: 0.92, sampleSize: 35 },
    { age: 35, productionMultiplier: 0.88, sampleSize: 28 }, // Decline begins
    { age: 36, productionMultiplier: 0.82, sampleSize: 22 },
    { age: 37, productionMultiplier: 0.75, sampleSize: 15 },
    { age: 38, productionMultiplier: 0.65, sampleSize: 10 },
    { age: 39, productionMultiplier: 0.55, sampleSize: 6 },
    { age: 40, productionMultiplier: 0.45, sampleSize: 3 }, // Cliff
  ],
  peakAgeStart: 28,
  peakAgeEnd: 32,
  breakoutAge: 25,
  declineAge: 35,
  cliffAge: 40,
};

/**
 * RB Age Curve
 * - Fast development (breakout around 22-23)
 * - Short prime window (24-27)
 * - Sharp decline after 28
 * - Extreme cliff around 30
 */
const RB_AGE_CURVE: PositionAgeCurve = {
  position: 'RB',
  curve: [
    { age: 21, productionMultiplier: 0.65, sampleSize: 42 },
    { age: 22, productionMultiplier: 0.80, sampleSize: 65 },
    { age: 23, productionMultiplier: 0.92, sampleSize: 78 },
    { age: 24, productionMultiplier: 0.98, sampleSize: 82 }, // Peak start
    { age: 25, productionMultiplier: 1.00, sampleSize: 85 },
    { age: 26, productionMultiplier: 1.00, sampleSize: 80 }, // Peak end
    { age: 27, productionMultiplier: 0.95, sampleSize: 72 },
    { age: 28, productionMultiplier: 0.85, sampleSize: 58 }, // Decline begins
    { age: 29, productionMultiplier: 0.72, sampleSize: 42 },
    { age: 30, productionMultiplier: 0.58, sampleSize: 28 }, // Cliff
    { age: 31, productionMultiplier: 0.45, sampleSize: 18 },
    { age: 32, productionMultiplier: 0.35, sampleSize: 10 },
    { age: 33, productionMultiplier: 0.25, sampleSize: 5 },
  ],
  peakAgeStart: 24,
  peakAgeEnd: 26,
  breakoutAge: 22,
  declineAge: 28,
  cliffAge: 30,
};

/**
 * WR Age Curve
 * - Moderate development (breakout around 23-24)
 * - Medium prime window (26-30)
 * - Gradual decline after 31
 * - Cliff around 33-34
 */
const WR_AGE_CURVE: PositionAgeCurve = {
  position: 'WR',
  curve: [
    { age: 21, productionMultiplier: 0.55, sampleSize: 38 },
    { age: 22, productionMultiplier: 0.70, sampleSize: 58 },
    { age: 23, productionMultiplier: 0.82, sampleSize: 72 },
    { age: 24, productionMultiplier: 0.90, sampleSize: 85 },
    { age: 25, productionMultiplier: 0.96, sampleSize: 92 },
    { age: 26, productionMultiplier: 0.99, sampleSize: 95 }, // Peak start
    { age: 27, productionMultiplier: 1.00, sampleSize: 98 },
    { age: 28, productionMultiplier: 1.00, sampleSize: 95 },
    { age: 29, productionMultiplier: 1.00, sampleSize: 88 }, // Peak end
    { age: 30, productionMultiplier: 0.97, sampleSize: 78 },
    { age: 31, productionMultiplier: 0.92, sampleSize: 65 }, // Decline begins
    { age: 32, productionMultiplier: 0.85, sampleSize: 48 },
    { age: 33, productionMultiplier: 0.75, sampleSize: 32 }, // Cliff
    { age: 34, productionMultiplier: 0.62, sampleSize: 20 },
    { age: 35, productionMultiplier: 0.48, sampleSize: 12 },
    { age: 36, productionMultiplier: 0.35, sampleSize: 6 },
  ],
  peakAgeStart: 26,
  peakAgeEnd: 29,
  breakoutAge: 23,
  declineAge: 31,
  cliffAge: 33,
};

/**
 * TE Age Curve
 * - Slow development (breakout around 25-26)
 * - Medium prime window (27-31)
 * - Gradual decline after 32
 * - Cliff around 34-35
 */
const TE_AGE_CURVE: PositionAgeCurve = {
  position: 'TE',
  curve: [
    { age: 21, productionMultiplier: 0.40, sampleSize: 22 },
    { age: 22, productionMultiplier: 0.52, sampleSize: 35 },
    { age: 23, productionMultiplier: 0.65, sampleSize: 48 },
    { age: 24, productionMultiplier: 0.78, sampleSize: 58 },
    { age: 25, productionMultiplier: 0.88, sampleSize: 65 },
    { age: 26, productionMultiplier: 0.95, sampleSize: 68 },
    { age: 27, productionMultiplier: 0.98, sampleSize: 70 }, // Peak start
    { age: 28, productionMultiplier: 1.00, sampleSize: 72 },
    { age: 29, productionMultiplier: 1.00, sampleSize: 68 },
    { age: 30, productionMultiplier: 1.00, sampleSize: 62 }, // Peak end
    { age: 31, productionMultiplier: 0.96, sampleSize: 52 },
    { age: 32, productionMultiplier: 0.90, sampleSize: 42 }, // Decline begins
    { age: 33, productionMultiplier: 0.82, sampleSize: 32 },
    { age: 34, productionMultiplier: 0.70, sampleSize: 22 }, // Cliff
    { age: 35, productionMultiplier: 0.55, sampleSize: 12 },
    { age: 36, productionMultiplier: 0.40, sampleSize: 6 },
  ],
  peakAgeStart: 27,
  peakAgeEnd: 30,
  breakoutAge: 25,
  declineAge: 32,
  cliffAge: 34,
};

// ============================================================================
// Age Curve Functions
// ============================================================================

/**
 * Get age curve for a position
 */
export function getAgeCurve(position: string): PositionAgeCurve {
  switch (position.toUpperCase()) {
    case 'QB':
      return QB_AGE_CURVE;
    case 'RB':
      return RB_AGE_CURVE;
    case 'WR':
      return WR_AGE_CURVE;
    case 'TE':
      return TE_AGE_CURVE;
    default:
      // Default to WR curve for unknown positions
      return WR_AGE_CURVE;
  }
}

/**
 * Get production multiplier for a specific age/position
 */
export function getProductionMultiplier(position: string, age: number): number {
  const curve = getAgeCurve(position);
  const dataPoint = curve.curve.find((p) => p.age === age);

  if (dataPoint) {
    return dataPoint.productionMultiplier;
  }

  // Interpolate if exact age not found
  const sortedCurve = [...curve.curve].sort((a, b) => a.age - b.age);

  if (age < sortedCurve[0].age) {
    // Younger than data - assume continued development
    return sortedCurve[0].productionMultiplier * 0.8;
  }

  if (age > sortedCurve[sortedCurve.length - 1].age) {
    // Older than data - assume continued decline
    return sortedCurve[sortedCurve.length - 1].productionMultiplier * 0.8;
  }

  // Linear interpolation between two closest ages
  for (let i = 0; i < sortedCurve.length - 1; i++) {
    if (age > sortedCurve[i].age && age < sortedCurve[i + 1].age) {
      const lower = sortedCurve[i];
      const upper = sortedCurve[i + 1];
      const ratio = (age - lower.age) / (upper.age - lower.age);
      return lower.productionMultiplier + ratio * (upper.productionMultiplier - lower.productionMultiplier);
    }
  }

  return 1.0; // Fallback
}

/**
 * Determine career phase based on age and position
 */
export function getCareerPhase(
  position: string,
  age: number
): PlayerTrajectory['phase'] {
  const curve = getAgeCurve(position);

  if (age < curve.breakoutAge) {
    return 'emerging';
  }

  if (age < curve.peakAgeStart) {
    return 'ascending';
  }

  if (age >= curve.peakAgeStart && age <= curve.peakAgeEnd) {
    return 'peak';
  }

  if (age > curve.peakAgeEnd && age < curve.cliffAge) {
    return 'declining';
  }

  return 'cliff';
}

/**
 * Calculate player production trajectory
 */
export function calculatePlayerTrajectory(
  player: SleeperPlayer,
  currentPPG: number = 15.0, // Default baseline
  yearsToProject: number = 3
): PlayerTrajectory {
  const age = player.age || 25; // Default age if not available
  const position = player.position;
  const curve = getAgeCurve(position);
  const currentPhase = getCareerPhase(position, age);

  // Calculate current production multiplier
  const currentMultiplier = getProductionMultiplier(position, age);

  // Normalize current PPG to peak level
  const peakPPG = currentMultiplier > 0 ? currentPPG / currentMultiplier : currentPPG;

  // Generate projections
  const projections = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= yearsToProject; i++) {
    const projectedAge = age + i;
    const projectedYear = currentYear + i;
    const projectedMultiplier = getProductionMultiplier(position, projectedAge);
    const projectedPPG = peakPPG * projectedMultiplier;

    // Confidence level based on age and data sample size
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    const curvePoint = curve.curve.find((p) => p.age === projectedAge);

    if (curvePoint) {
      if (curvePoint.sampleSize > 50) confidenceLevel = 'high';
      else if (curvePoint.sampleSize < 20) confidenceLevel = 'low';
    }

    projections.push({
      year: projectedYear,
      age: projectedAge,
      projectedPPG: Math.round(projectedPPG * 10) / 10,
      confidenceLevel,
    });
  }

  // Determine value trend
  const yearsToPeak = Math.max(0, curve.peakAgeStart - age);
  const yearsToDecline = Math.max(0, curve.declineAge - age);

  let valueTrend: PlayerTrajectory['valueTrend'];
  let trendRationale: string;

  if (currentPhase === 'emerging') {
    valueTrend = 'buy-now';
    trendRationale = `Emerging talent (age ${age}). Peak years ahead (${curve.peakAgeStart}-${curve.peakAgeEnd}). Dynasty value will increase.`;
  } else if (currentPhase === 'ascending') {
    valueTrend = 'buy-now';
    trendRationale = `Entering prime years (age ${age}). Peak window approaching in ${yearsToPeak} year${yearsToPeak !== 1 ? 's' : ''}. Strong buy window.`;
  } else if (currentPhase === 'peak') {
    if (age <= curve.peakAgeStart + 1) {
      valueTrend = 'hold';
      trendRationale = `Early peak years (age ${age}). Hold for production. Sell window opens in ${yearsToDecline} year${yearsToDecline !== 1 ? 's' : ''}.`;
    } else {
      valueTrend = 'sell-high';
      trendRationale = `Late peak years (age ${age}). Maximize value now. Decline likely in ${yearsToDecline} year${yearsToDecline !== 1 ? 's' : ''}.`;
    }
  } else if (currentPhase === 'declining') {
    valueTrend = 'sell-now';
    trendRationale = `Declining phase (age ${age}). Value eroding. Sell for whatever you can get.`;
  } else {
    valueTrend = 'sell-now';
    trendRationale = `Career cliff reached (age ${age}). Minimal dynasty value remaining.`;
  }

  return {
    playerId: player.player_id,
    playerName: player.full_name,
    position,
    currentAge: age,
    phase: currentPhase,
    yearsToPeak,
    yearsToDecline,
    projections,
    valueTrend,
    trendRationale,
  };
}

/**
 * Compare age curves for two players
 */
export function comparePlayerTrajectories(
  player1: SleeperPlayer,
  player2: SleeperPlayer,
  player1PPG: number = 15.0,
  player2PPG: number = 15.0
): {
  player1: PlayerTrajectory;
  player2: PlayerTrajectory;
  recommendation: string;
} {
  const traj1 = calculatePlayerTrajectory(player1, player1PPG);
  const traj2 = calculatePlayerTrajectory(player2, player2PPG);

  // Compare 3-year outlook
  const player1Year3 = traj1.projections[3]?.projectedPPG || 0;
  const player2Year3 = traj2.projections[3]?.projectedPPG || 0;

  let recommendation: string;

  if (player1Year3 > player2Year3 * 1.1) {
    recommendation = `${player1.full_name} has superior dynasty outlook. Projected ${Math.round((player1Year3 - player2Year3) * 10) / 10} more PPG in Year 3.`;
  } else if (player2Year3 > player1Year3 * 1.1) {
    recommendation = `${player2.full_name} has superior dynasty outlook. Projected ${Math.round((player2Year3 - player1Year3) * 10) / 10} more PPG in Year 3.`;
  } else {
    recommendation = `Similar dynasty outlook. Consider team situations and personal preferences.`;
  }

  return {
    player1: traj1,
    player2: traj2,
    recommendation,
  };
}

/**
 * Get all players approaching decline phase
 */
export function getPlayersApproachingDecline(
  players: SleeperPlayer[],
  withinYears: number = 2
): Array<{ player: SleeperPlayer; yearsToDecline: number }> {
  return players
    .map((player) => {
      const age = player.age || 25;
      const curve = getAgeCurve(player.position);
      const yearsToDecline = Math.max(0, curve.declineAge - age);

      return { player, yearsToDecline };
    })
    .filter((item) => item.yearsToDecline <= withinYears && item.yearsToDecline >= 0)
    .sort((a, b) => a.yearsToDecline - b.yearsToDecline);
}

/**
 * Get all players in peak window
 */
export function getPlayersInPeak(players: SleeperPlayer[]): SleeperPlayer[] {
  return players.filter((player) => {
    const age = player.age || 25;
    return getCareerPhase(player.position, age) === 'peak';
  });
}
