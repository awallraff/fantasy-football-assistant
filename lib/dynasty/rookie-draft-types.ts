/**
 * Dynasty Rookie Draft Type Definitions
 *
 * This module provides comprehensive type definitions for rookie draft management,
 * including rookie player data, draft order, rankings, and team needs analysis.
 */

import type { SleeperPlayer } from '@/lib/sleeper-api';

// ============================================================================
// Core Rookie Player Types
// ============================================================================

/**
 * NFL Draft capital information
 */
export interface NFLDraftCapital {
  /** NFL draft year (e.g., 2025) */
  year: number;

  /** NFL draft round (1-7) */
  round: number;

  /** Overall pick number (1-262) */
  overallPick: number;

  /** NFL team that drafted the player */
  draftedBy: string;
}

/**
 * College production metrics
 */
export interface CollegeProduction {
  /** School name */
  school: string;

  /** Years played */
  yearsPlayed: number;

  /** Total games played */
  gamesPlayed: number;

  /** Career statistics (position-dependent) */
  careerStats: {
    // QB stats
    passingYards?: number;
    passingTDs?: number;
    interceptions?: number;

    // RB stats
    rushingYards?: number;
    rushingTDs?: number;

    // WR/TE stats
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;
  };

  /** Notable achievements (Heisman, All-American, etc.) */
  awards?: string[];
}

/**
 * Dynasty-specific player projections
 */
export interface DynastyProjection {
  /** Projected fantasy points per game (Year 1) */
  year1PPG: number;

  /** Projected fantasy points per game (Year 3 - peak projection) */
  year3PPG: number;

  /** Ceiling outcome (90th percentile) */
  ceiling: string;

  /** Floor outcome (10th percentile) */
  floor: string;

  /** Most likely outcome (50th percentile) */
  mostLikely: string;

  /** Bust risk percentage (0-100) */
  bustRisk: number;
}

/**
 * Complete rookie player profile extending Sleeper player data
 */
export interface RookiePlayer extends Omit<SleeperPlayer, 'college'> {
  /** NFL draft capital */
  nflDraft: NFLDraftCapital;

  /** College production metrics (extended from simple string in SleeperPlayer) */
  college?: CollegeProduction | string;

  /** Dynasty projections */
  projection: DynastyProjection;

  /** Consensus dynasty rookie ranking (1-100) */
  consensusRank: number;

  /** Positional ranking within rookie class */
  positionRank: number;

  /** Tier classification (1-5, where 1 is elite) */
  tier: number;

  /** Landing spot grade (A+ to F based on team situation) */
  landingSpotGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

  /** Key strengths (2-3 bullet points) */
  strengths: string[];

  /** Key concerns (2-3 bullet points) */
  concerns: string[];
}

// ============================================================================
// Rookie Rankings Types
// ============================================================================

/**
 * Ranking source (for consensus calculation)
 */
export type RankingSource = 'dynastynerds' | 'fantasypros' | 'dlf' | 'sleeper' | 'internal';

/**
 * Individual ranking from a source
 */
export interface RankingData {
  /** Source of the ranking */
  source: RankingSource;

  /** Overall rank */
  overallRank: number;

  /** Positional rank */
  positionRank: number;

  /** Tier assignment */
  tier: number;

  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Consensus rookie ranking (aggregated from multiple sources)
 */
export interface RookieRanking {
  /** Player ID (Sleeper format) */
  playerId: string;

  /** Player name */
  playerName: string;

  /** Position */
  position: string;

  /** NFL team */
  team: string;

  /** Consensus overall rank */
  consensusRank: number;

  /** Consensus positional rank */
  positionRank: number;

  /** Consensus tier */
  tier: number;

  /** Individual rankings from sources */
  rankings: RankingData[];

  /** Standard deviation of ranks (volatility indicator) */
  rankStdDev: number;

  /** ADP (Average Draft Position) in rookie drafts */
  adp: number;
}

// ============================================================================
// Draft Management Types
// ============================================================================

/**
 * Draft pick position in rookie draft
 */
export interface RookieDraftPick {
  /** League ID */
  leagueId: string;

  /** Draft pick number (1.01, 1.02, etc.) */
  pickNumber: string;

  /** Round (1-5 typical for dynasty) */
  round: number;

  /** Pick within round (1-12 for 12-team league) */
  pickInRound: number;

  /** Team that owns this pick */
  ownerId: string;

  /** Original owner (if traded) */
  originalOwnerId?: string;

  /** Player selected (if draft has occurred) */
  selectedPlayerId?: string;
}

/**
 * Team draft picks portfolio
 */
export interface TeamDraftPicks {
  /** Team/roster ID */
  teamId: string;

  /** Team owner name */
  ownerName: string;

  /** List of picks owned */
  picks: RookieDraftPick[];

  /** Total pick value (using draft pick valuation) */
  totalPickValue: number;
}

/**
 * Team positional needs
 */
export interface TeamNeeds {
  /** Team/roster ID */
  teamId: string;

  /** Positions ranked by need (QB, RB, WR, TE) */
  needs: Array<{
    position: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
  }>;

  /** Rebuild vs Contend status */
  teamStrategy: 'rebuild' | 'retool' | 'contend' | 'win-now';
}

/**
 * Draft board state
 */
export interface DraftBoard {
  /** League ID */
  leagueId: string;

  /** Draft year */
  year: number;

  /** Total number of rounds */
  totalRounds: number;

  /** All draft picks in order */
  picks: RookieDraftPick[];

  /** Available players (not yet drafted) */
  availablePlayers: string[];

  /** Current pick on the clock */
  currentPickNumber: string | null;

  /** Draft status */
  status: 'pre-draft' | 'in-progress' | 'complete';
}

/**
 * Mock draft selection
 */
export interface MockDraftSelection {
  /** Pick number */
  pickNumber: string;

  /** Player selected */
  playerId: string;

  /** Rationale for selection */
  rationale: string;

  /** Alternative players considered */
  alternatives: string[];
}

// ============================================================================
// Draft Strategy Types
// ============================================================================

/**
 * Best available player recommendation
 */
export interface BestAvailable {
  /** Player ID */
  playerId: string;

  /** Consensus rank */
  rank: number;

  /** Value score (how much better than ADP) */
  valueScore: number;

  /** Why this player is best available */
  reasoning: string;
}

/**
 * Positional target recommendations
 */
export interface PositionalTarget {
  /** Position */
  position: string;

  /** Recommended players at this position */
  players: Array<{
    playerId: string;
    rank: number;
    fit: 'excellent' | 'good' | 'fair' | 'reach';
  }>;

  /** Why target this position */
  reasoning: string;
}

/**
 * Complete draft strategy recommendation
 */
export interface DraftStrategy {
  /** User's team ID */
  teamId: string;

  /** Team needs analysis */
  teamNeeds: TeamNeeds;

  /** Best available players for current pick */
  bestAvailable: BestAvailable[];

  /** Positional targets */
  positionalTargets: PositionalTarget[];

  /** Recommended approach */
  recommendation: {
    strategy: 'bpa' | 'position-need' | 'upside' | 'safe-floor';
    primaryTarget: string;
    reasoning: string;
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  // Re-export for convenience
  SleeperPlayer,
};

/**
 * Rookie draft class (all rookies for a given year)
 */
export interface RookieDraftClass {
  /** Draft year */
  year: number;

  /** All rookie players */
  players: RookiePlayer[];

  /** Consensus rankings */
  rankings: RookieRanking[];

  /** Last updated */
  updatedAt: Date;

  /** Data sources used */
  sources: RankingSource[];
}

/**
 * Filter options for rookie rankings
 */
export interface RookieFilterOptions {
  /** Filter by position */
  position?: string[];

  /** Filter by tier */
  tier?: number[];

  /** Filter by NFL team */
  team?: string[];

  /** Filter by landing spot grade */
  landingSpotGrade?: string[];

  /** Minimum consensus rank */
  minRank?: number;

  /** Maximum consensus rank */
  maxRank?: number;
}

/**
 * Sort options for rookie rankings
 */
export type RookieSortOption =
  | 'consensus-rank'
  | 'adp'
  | 'nfl-draft-capital'
  | 'position-rank'
  | 'tier'
  | 'upside'
  | 'landing-spot';
