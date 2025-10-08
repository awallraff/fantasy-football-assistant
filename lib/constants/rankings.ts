/**
 * Rankings Constants
 *
 * Constants used throughout the rankings system for consistency and maintainability.
 */

/**
 * Debounce timeout for API calls (in milliseconds).
 * Used to prevent rapid successive API calls when loading rankings.
 */
export const API_DEBOUNCE_TIMEOUT_MS = 500;

/**
 * Maximum number of items to display in sliced/preview lists.
 * Used for limiting the initial display of large ranking lists.
 */
export const MAX_PREVIEW_ITEMS = 100;

/**
 * NFL Season Date Configuration
 *
 * These dates define the approximate boundaries of the NFL season phases:
 * - Preseason: August 1 - September 10 (preparation for Week 1)
 * - Regular season: September 11 - January 8 (Weeks 1-18)
 * - Playoffs: January 9 - February 15
 * - Offseason: February 16 - July 31 (preparation for next season)
 */
export const NFL_SEASON_DATES = {
  /** Month when preseason begins (1-12, where 1 is January) */
  PRESEASON_START_MONTH: 8, // August
  /** Day when preseason begins */
  PRESEASON_START_DAY: 1,

  /** Month when regular season begins (1-12, where 1 is January) */
  REGULAR_SEASON_START_MONTH: 9, // September
  /** Day when regular season begins */
  REGULAR_SEASON_START_DAY: 11,

  /** Month when playoffs begin (1-12, where 1 is January) */
  PLAYOFFS_START_MONTH: 1, // January
  /** Day when playoffs begin */
  PLAYOFFS_START_DAY: 9,

  /** Month when playoffs end (1-12, where 1 is January) */
  PLAYOFFS_END_MONTH: 2, // February
  /** Day when playoffs end */
  PLAYOFFS_END_DAY: 15,

  /** Number of weeks in regular season */
  REGULAR_SEASON_WEEKS: 18,
} as const;

/**
 * Milliseconds in one week (used for date calculations)
 */
export const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
