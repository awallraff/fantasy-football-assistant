/**
 * Dynasty Draft Pick Valuation System
 *
 * This module provides comprehensive draft pick valuation for dynasty fantasy football.
 * It calculates the trade value of draft picks based on:
 * - Round (1st, 2nd, 3rd, etc.)
 * - Year (current year vs future years with discount)
 * - Team standing (early, mid, late pick projections)
 * - League settings (roster size, scoring format)
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents a draft pick's position within a round
 */
export type PickPosition = 'early' | 'mid' | 'late' | 'unknown';

/**
 * Draft pick round (1-4+ for typical dynasty leagues)
 */
export type DraftRound = 1 | 2 | 3 | 4 | 5;

/**
 * Time horizon for the draft pick
 */
export type PickYear = number; // e.g., 2025, 2026, 2027

/**
 * Core draft pick interface
 */
export interface DraftPick {
  /** Unique identifier for this pick */
  id: string;

  /** The round (1st, 2nd, 3rd, etc.) */
  round: DraftRound;

  /** The year of the draft */
  year: PickYear;

  /** Projected position within the round */
  position: PickPosition;

  /** The original owner of this pick */
  originalOwnerId?: string;

  /** The current owner of this pick */
  currentOwnerId?: string;

  /** League ID this pick belongs to */
  leagueId: string;
}

/**
 * Calculated valuation for a draft pick
 */
export interface PickValuation {
  /** The draft pick being valued */
  pick: DraftPick;

  /** Raw valuation score (0-1000+ scale) */
  rawValue: number;

  /** Year-discounted value (accounts for time value) */
  discountedValue: number;

  /** Position-adjusted value (early/mid/late) */
  positionAdjustedValue: number;

  /** Final composite value */
  finalValue: number;

  /** Value tier classification */
  tier: 'elite' | 'premium' | 'solid' | 'depth' | 'lottery';

  /** Equivalent player value range (for trade context) */
  playerValueEquivalent: {
    low: number;
    high: number;
  };

  /** Human-readable description */
  description: string;
}

/**
 * Configuration for pick valuation calculations
 */
export interface ValuationConfig {
  /** Base values for each round (1st = highest) */
  baseValues: Record<DraftRound, number>;

  /** Year discount factor (0-1, where 1 = no discount) */
  yearDiscountRate: number;

  /** Position multipliers (early/mid/late) */
  positionMultipliers: Record<PickPosition, number>;

  /** League size factor (affects pick value) */
  leagueSize: number;

  /** Superflex league? (QBs more valuable) */
  isSuperflex: boolean;

  /** Premium position settings (TE premium, etc.) */
  premiumPositions?: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default valuation configuration based on industry consensus
 * (DLF, KeepTradeCut, Dynasty Nerds data)
 */
export const DEFAULT_VALUATION_CONFIG: ValuationConfig = {
  // Base values (1000 point scale)
  baseValues: {
    1: 1000, // 1st round picks are most valuable
    2: 400,  // 2nd round = ~40% of 1st
    3: 200,  // 3rd round = ~20% of 1st
    4: 100,  // 4th round = ~10% of 1st
    5: 50,   // 5th round = ~5% of 1st
  },

  // Future picks are discounted (3 years out = ~60% of current year value)
  yearDiscountRate: 0.85, // 15% discount per year

  // Position within round matters significantly
  positionMultipliers: {
    early: 1.3,   // Top 4 picks (1.01-1.04) worth 30% more
    mid: 1.0,     // Middle picks baseline
    late: 0.8,    // Late picks (1.09-1.12) worth 20% less
    unknown: 1.0, // Default to mid-round
  },

  // Default 12-team league
  leagueSize: 12,

  // Standard scoring (not superflex)
  isSuperflex: false,
};

/**
 * Superflex-specific configuration (QBs are premium)
 */
export const SUPERFLEX_VALUATION_CONFIG: ValuationConfig = {
  ...DEFAULT_VALUATION_CONFIG,
  isSuperflex: true,
  // 1st round picks in superflex are worth MORE due to QB scarcity
  baseValues: {
    1: 1200, // 20% premium for 1st round in superflex
    2: 450,
    3: 220,
    4: 110,
    5: 55,
  },
};

// ============================================================================
// Valuation Functions
// ============================================================================

/**
 * Calculate the year discount for a future draft pick
 *
 * @param year - The year of the draft pick
 * @param currentYear - Current year (defaults to current season)
 * @param discountRate - Annual discount rate (0-1)
 * @returns Discount multiplier (1.0 = current year, <1.0 = future years)
 */
export function calculateYearDiscount(
  year: number,
  currentYear: number = new Date().getFullYear(),
  discountRate: number = DEFAULT_VALUATION_CONFIG.yearDiscountRate
): number {
  const yearsOut = Math.max(0, year - currentYear);
  return Math.pow(discountRate, yearsOut);
}

/**
 * Determine pick tier based on final value
 *
 * @param value - Final calculated value
 * @returns Value tier classification
 */
export function determinePickTier(value: number): PickValuation['tier'] {
  if (value >= 1000) return 'elite';      // Top picks (early 1st)
  if (value >= 500) return 'premium';     // Mid-late 1st, early 2nd
  if (value >= 250) return 'solid';       // Late 2nd, 3rd round
  if (value >= 100) return 'depth';       // 4th+ round
  return 'lottery';                       // Late-round fliers
}

/**
 * Generate human-readable description of pick value
 *
 * @param valuation - The calculated valuation
 * @returns Description string
 */
export function generatePickDescription(valuation: PickValuation): string {
  const { pick, tier, finalValue } = valuation;
  const roundName = `${pick.round}${getOrdinalSuffix(pick.round)} round`;
  const yearDesc = pick.year === new Date().getFullYear() ? 'current year' : `${pick.year}`;
  const positionDesc = pick.position !== 'unknown' ? ` (${pick.position})` : '';

  const tierDescriptions: Record<PickValuation['tier'], string> = {
    elite: 'Premium asset - likely top-tier rookie talent',
    premium: 'Strong value - quality starter potential',
    solid: 'Solid depth piece - rotational player expected',
    depth: 'Developmental asset - high variance outcome',
    lottery: 'Lottery ticket - low probability hit',
  };

  return `${roundName} ${yearDesc}${positionDesc} - ${tierDescriptions[tier]} (Value: ${Math.round(finalValue)})`;
}

/**
 * Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Calculate player value equivalent range for a pick
 * This helps contextualize pick value in terms of player rankings
 *
 * @param finalValue - Final calculated pick value
 * @param config - Valuation configuration
 * @returns Range of equivalent player values
 */
export function calculatePlayerValueEquivalent(
  finalValue: number,
  config: ValuationConfig = DEFAULT_VALUATION_CONFIG
): { low: number; high: number } {
  // Rough mapping: 1st round picks = top 30 players
  // 2nd round = players 30-60, etc.
  const baseMapping = finalValue / 10; // Scale to player ranking range
  const variance = baseMapping * 0.2; // ±20% variance

  return {
    low: Math.max(1, Math.round(baseMapping - variance)),
    high: Math.round(baseMapping + variance),
  };
}

/**
 * Core valuation calculation function
 *
 * @param pick - The draft pick to value
 * @param config - Valuation configuration (defaults to standard league)
 * @returns Complete valuation breakdown
 */
export function valuateDraftPick(
  pick: DraftPick,
  config: ValuationConfig = DEFAULT_VALUATION_CONFIG
): PickValuation {
  // Step 1: Get base value for the round
  const baseValue = config.baseValues[pick.round] || 0;

  // Step 2: Apply year discount
  const yearDiscount = calculateYearDiscount(pick.year);
  const discountedValue = baseValue * yearDiscount;

  // Step 3: Apply position multiplier
  const positionMultiplier = config.positionMultipliers[pick.position] || 1.0;
  const positionAdjustedValue = discountedValue * positionMultiplier;

  // Step 4: League-specific adjustments
  let finalValue = positionAdjustedValue;

  // Larger leagues = picks slightly more valuable (deeper talent pool)
  if (config.leagueSize > 12) {
    finalValue *= 1.1;
  } else if (config.leagueSize < 10) {
    finalValue *= 0.9;
  }

  // Superflex premium already baked into base values

  // Step 5: Determine tier and generate description
  const tier = determinePickTier(finalValue);
  const playerValueEquivalent = calculatePlayerValueEquivalent(finalValue, config);

  const valuation: PickValuation = {
    pick,
    rawValue: baseValue,
    discountedValue,
    positionAdjustedValue,
    finalValue,
    tier,
    playerValueEquivalent,
    description: '', // Will be set below
  };

  valuation.description = generatePickDescription(valuation);

  return valuation;
}

/**
 * Compare two draft picks and return the difference in value
 *
 * @param pick1 - First draft pick
 * @param pick2 - Second draft pick
 * @param config - Valuation configuration
 * @returns Positive if pick1 > pick2, negative if pick2 > pick1
 */
export function compareDraftPicks(
  pick1: DraftPick,
  pick2: DraftPick,
  config: ValuationConfig = DEFAULT_VALUATION_CONFIG
): number {
  const val1 = valuateDraftPick(pick1, config);
  const val2 = valuateDraftPick(pick2, config);
  return val1.finalValue - val2.finalValue;
}

/**
 * Calculate total value of a collection of draft picks
 *
 * @param picks - Array of draft picks
 * @param config - Valuation configuration
 * @returns Total combined value
 */
export function calculatePickPortfolioValue(
  picks: DraftPick[],
  config: ValuationConfig = DEFAULT_VALUATION_CONFIG
): number {
  return picks.reduce((total, pick) => {
    const valuation = valuateDraftPick(pick, config);
    return total + valuation.finalValue;
  }, 0);
}

/**
 * Convert Sleeper draft pick format to our DraftPick interface
 *
 * @param sleeperPick - Pick from Sleeper API
 * @param leagueId - League ID
 * @returns Standardized DraftPick
 */
export function convertSleeperPick(
  sleeperPick: {
    season: string;
    round: number;
    roster_id: number;
    previous_owner_id?: number;
  },
  leagueId: string
): DraftPick {
  return {
    id: `${leagueId}_${sleeperPick.season}_${sleeperPick.round}_${sleeperPick.roster_id}`,
    round: Math.min(sleeperPick.round, 5) as DraftRound,
    year: parseInt(sleeperPick.season),
    position: 'unknown', // Will need roster standings to determine
    originalOwnerId: sleeperPick.previous_owner_id?.toString(),
    currentOwnerId: sleeperPick.roster_id.toString(),
    leagueId,
  };
}

// ============================================================================
// Export main API
// ============================================================================

export {
  valuateDraftPick as default,
};
