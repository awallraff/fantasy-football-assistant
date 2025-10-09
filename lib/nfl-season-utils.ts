/**
 * NFL Season Utilities
 *
 * Utilities for calculating NFL season dates, weeks, and schedules.
 */

import { NFL_SEASON_DATES, WEEK_IN_MS } from "./constants/rankings";

/**
 * Result of calculating the next upcoming NFL week
 */
export interface NextUpcomingWeek {
  /** The NFL season year */
  year: number;
  /** The week number (1-18 for regular season) */
  week: number;
}

/**
 * Determines the next upcoming NFL week based on the current date.
 *
 * This function calculates which NFL week is next based on:
 * - Preseason: August 1 - September 10 (prep for Week 1)
 * - Regular season: September 11 - January 8 (Weeks 1-18)
 * - Playoffs: January 9 - February 15
 * - Offseason: February 16 - July 31 (prep for next season)
 *
 * @returns An object containing the target year and week number
 *
 * @example
 * ```ts
 * const { year, week } = getNextUpcomingWeek();
 * console.log(`Next NFL week: Week ${week} of ${year}`);
 * ```
 */
export function getNextUpcomingWeek(): NextUpcomingWeek {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = now.getDate();

  let targetYear = currentYear;
  let targetWeek = 1;

  if (currentMonth >= NFL_SEASON_DATES.REGULAR_SEASON_START_MONTH && currentDay >= NFL_SEASON_DATES.REGULAR_SEASON_START_DAY) {
    // We're in the current NFL season (Sep 11 - Dec 31)
    targetYear = currentYear;
    // Estimate current week based on date
    const seasonStart = new Date(currentYear, NFL_SEASON_DATES.REGULAR_SEASON_START_MONTH - 1, NFL_SEASON_DATES.REGULAR_SEASON_START_DAY);
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / WEEK_IN_MS);
    targetWeek = Math.min(Math.max(weeksSinceStart + 1, 1), NFL_SEASON_DATES.REGULAR_SEASON_WEEKS);
  } else if (currentMonth >= NFL_SEASON_DATES.PLAYOFFS_START_MONTH && currentMonth <= NFL_SEASON_DATES.PLAYOFFS_END_MONTH) {
    // We're in playoffs/early offseason (Jan 1 - Feb 15)
    // Target next season's Week 1
    targetYear = currentYear;
    targetWeek = 1;
  } else {
    // We're in offseason/preseason (Feb 16 - Sep 10)
    // Target upcoming season's Week 1
    if (currentMonth >= NFL_SEASON_DATES.PLAYOFFS_END_MONTH) {
      targetYear = currentYear; // Same year for March-August
    } else {
      targetYear = currentYear; // January-February is still current season year
    }
    targetWeek = 1;
  }

  return { year: targetYear, week: targetWeek };
}
